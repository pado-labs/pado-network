/**
 * Worker: EigenLayer
 */
import { Logger } from "pino";
import { ethers } from "ethers";
import { BuildAllConfig, buildAll, Clients } from "../clients/builder";
import { getPrivateKey, stringToUint8Array, Uint8ArrayToString } from "../utils";
import { WorkerConfig } from "./config";
import { NodeApi } from "../nodeapi";
import { Registry } from 'prom-client';
import { EigenMetrics } from "../metrics/eigenmetrics";
import { Collector as RpcCollector } from "../metrics/collectors/rpc-calls/rps-calls";
import { Collector as EconomicsCollector } from "../metrics/collectors/economic/economics";

import * as dotenv from "dotenv";
dotenv.config();

import { AbstractWorker, ChainType } from "./types";
import { RegisterParams, RegisterResult, DeregisterParams, DeregisterResult, UpdateParams, UpdateResult } from "./types";
import { DoTaskParams, DoTaskResult } from "./types";
import { initAll, runWorker } from "./worker";
import { buildPadoClient, PadoClient } from "../clients/pado";
import { readFileSync } from "node:fs";
import { createDataItemSigner } from "@permaweb/aoconnect";
import Arweave from "arweave";
import { reencrypt_v2 } from "../crypto/lhe";
import { buildStorageClient, StorageClient, StorageType } from "../clients/storage";


export class EigenLayerWorker extends AbstractWorker {
  ecdsaWallet!: ethers.Wallet
  clients!: Clients;
  padoClient!: PadoClient;
  storageClient!: StorageClient;
  eigenMetrics!: EigenMetrics;
  lheKey!: any;
  arWallet!: any;
  arSigner!: any;
  arweave!: any;

  constructor(chainType: ChainType = ChainType.Ethereum) {
    super();
    this.chainType = chainType;
  }

  async register(params: RegisterParams): Promise<RegisterResult> {
    console.log('register params', params);
    const cfg = this.cfg;

    try {
      // @ts-ignore
      const name = params.name;
      // @ts-ignore
      const desc = params.description;
      // @todo: params.taskTypeConfig??
      const quorums = params.extraData ? params.extraData["quorums"] : [0]; // todo: failed if not set

      const salt = ethers.utils.hexlify(ethers.utils.randomBytes(32));
      const expiry = Math.floor(Date.now() / 1000) + cfg.operatorSignatureExpirySeconds;
      const blsPrivateKey = await getPrivateKey(cfg.blsKeyFile, cfg.blsKeyPass);
      const quorumNumbers = quorums;
      const socket = cfg.operatorSocketIpPort;

      const taskTypes = [0]; // todo

      let publicKeys = [];
      {
        // upload pk to arweave
        let pkData = Uint8Array.from(Buffer.from(this.lheKey.pk, 'hex'));
        const pkTransactionId = await this.storageClient.submitData(this.cfg.dataStorageType, pkData);
        console.log('pkTransactionId ', pkTransactionId);
        const pkTransactionIdHex = ethers.utils.hexlify(stringToUint8Array(pkTransactionId));
        console.log('pkTransactionIdHex ', pkTransactionIdHex);
        publicKeys.push(pkTransactionIdHex);
      }

      const res = await this.clients.avsClient.registerOperatorInQuorumWithAVSWorkerManager(
        taskTypes,
        publicKeys,
        salt,
        expiry,
        blsPrivateKey,
        quorumNumbers,
        socket,
      );
      console.log(`registerNode res=${res}`);
    } catch (e) {
      console.log("registerNode exception:", e);
    }

    return Promise.resolve({});
  }

  deregister(params: DeregisterParams): Promise<DeregisterResult> {
    console.log('deregister params', params);
    return Promise.resolve({});
  }
  update(params: UpdateParams): Promise<UpdateResult> {
    console.log('update params', params);
    return Promise.resolve({});
  }

  async doTask(params: DoTaskParams): Promise<DoTaskResult> {
    console.log('doTask params', params);
    try {
      await this._doTask();
    } catch (e) {
      console.log("doTaskLoop exception:", e);
    }

    return Promise.resolve({});
  }

  private async _getWorkId(): Promise<string> {
    return await this.clients.avsClient.getOperatorId(this.ecdsaWallet.address);
  }


  private async _doTask() {
    // @todo split this function

    // const tasks = await this.padoClient.getPendingTasks();
    // console.log('getPendingTasks', tasks.length);

    const workerId = await this._getWorkId(); // todo: to outside, valid check
    console.log('workerId', workerId);

    const tasks = await this.padoClient.getPendingTasksByWorkerId(workerId);
    console.log('tasks.length', tasks.length);
    // console.log('getPendingTasksByWorkerId', tasks);

    for (const task of tasks) {
      console.log('-------------------------------------------');
      console.log('task.task', task.taskId);
      console.log('task.taskType', task.taskType);
      // console.log('task.consumerPk', task.consumerPk); // todo, also update to ar?
      console.log('task.dataId', task.dataId);
      // console.log('task.computingInfo', task.computingInfo);


      // get data from arweave
      const dataInfo = await this.padoClient.getDataById(task.dataId);
      console.log('dataInfo.dataContent ', dataInfo.dataContent);
      console.log('dataInfo.workerIds ', dataInfo.workerIds);
      const dataIdArr = ethers.utils.arrayify(dataInfo.dataContent);
      const transactionId = Uint8ArrayToString(dataIdArr);
      console.log('data transactionId ', transactionId);
      const enc_data = await this.storageClient.fetchData(this.cfg.dataStorageType, transactionId);
      // console.log('enc_data ', enc_data);

      // re-encrypt if task.taskType is DataSharing
      const enc_sk_index = dataInfo.workerIds.indexOf(workerId); // assuming the order of workerIds
      if (enc_sk_index == -1) {
        this.logger.error(`taskId:${task.taskId}, workerId:${workerId} not in dataInfo.workerIds`);
        continue;
      }
      const node_sk = this.lheKey.sk;
      let consumer_pk;
      {
        // get consumer pk from ar
        console.log('task.consumerPk ', task.consumerPk);
        const dataIdArr = ethers.utils.arrayify(task.consumerPk);
        const transactionId = Uint8ArrayToString(dataIdArr);
        console.log('consumerPk transactionId ', transactionId);
        const pkData = await this.storageClient.fetchData(this.cfg.dataStorageType, transactionId);
        consumer_pk = Buffer.from(pkData).toString('hex');
      }

      // console.log('node_sk:', node_sk)
      // console.log('consumer_pk:', consumer_pk)
      const reenc_sk = reencrypt_v2(enc_sk_index + 1, node_sk, consumer_pk, enc_data);
      // console.log("reencrypt reenc_sk=", reenc_sk);

      // update result to arweave
      const reEncTransactionId = await this.storageClient.submitData(this.cfg.dataStorageType, reenc_sk);
      console.log('reEncTransactionId ', reEncTransactionId);
      const reEncryptTransactionId = ethers.utils.hexlify(stringToUint8Array(reEncTransactionId));
      console.log('reEncryptTransactionId', reEncryptTransactionId);


      // report result
      // todo: how when failed?
      const res = await this.padoClient.reportResult(task.taskId, workerId, reEncryptTransactionId);
      console.log('reportResult', res);
    }
    // TODO add something to monitor if failed
  }
};

export async function newEigenLayerWorker(cfg: WorkerConfig, logger: Logger, nodeApi: NodeApi, registry: Registry): Promise<EigenLayerWorker> {
  const worker = new EigenLayerWorker(ChainType.Holesky);
  worker.logger = logger;
  worker.nodeApi = nodeApi;
  worker.registry = registry;

  // init something special

  // Clients
  const ethProvider = new ethers.providers.JsonRpcProvider(cfg.ethRpcUrl);
  const ecdsaPrivateKey = await getPrivateKey(cfg.ecdsaKeyFile, cfg.ecdsaKeyPass);
  const ecdsaWallet = new ethers.Wallet(ecdsaPrivateKey, ethProvider);
  worker.ecdsaWallet = ecdsaWallet;

  const config = new BuildAllConfig(
    cfg.registryCoordinatorAddress,
    cfg.operatorStateRetrieverAddress,
    cfg.workerMgtAddress,
    ecdsaWallet, logger);
  const clients = await buildAll(config); // todo, no need build all clients
  worker.clients = clients;

  worker.padoClient = await buildPadoClient(ecdsaWallet, cfg.dataMgtAddress, cfg.taskMgtAddress, cfg.workerMgtAddress, logger);

  const lheKey = JSON.parse(readFileSync(cfg.lheKeyPath).toString());
  worker.lheKey = lheKey;

  if (cfg.dataStorageType == StorageType.ARSEEDING_AR || cfg.dataStorageType == StorageType.ARWEAVE) {
    const wallet = JSON.parse(readFileSync(cfg.arWalletPath).toString());
    const signer = createDataItemSigner(wallet);
    worker.arWallet = wallet;
    worker.arSigner = signer;

    const arweave = Arweave.init({
      host: cfg.arweaveApiHost,
      port: cfg.arweaveApiPort,
      protocol: cfg.arweaveApiProtocol,
    });
    worker.arweave = arweave;
  }

  worker.storageClient = await buildStorageClient(worker.ecdsaWallet, worker.arWallet, worker.arweave, worker.logger);


  // @ts-ignore
  const rpcCollector = new RpcCollector(cfg.avsName, registry);

  // todo
  const quorumNames = {
    "0": "quorum0",
    "1": "quorum1",
    "2": "quorum2",
    "3": "quorum3",
  };
  // @ts-ignore
  const economicsCollector = new EconomicsCollector(
    worker.clients.elClient,
    worker.clients.avsClient,
    cfg.avsName, logger, worker.ecdsaWallet.address, quorumNames,
    registry);

  const eigenMetrics = new EigenMetrics(cfg.avsName, logger, registry);
  worker.eigenMetrics = eigenMetrics;


  worker.cfg = cfg;
  return worker;
}


async function test() {
  const [cfg, logger, nodeApi, registry, metrics] = initAll();
  const worker = await newEigenLayerWorker(cfg, logger, nodeApi, registry);
  console.log('typeof worker', typeof worker);

  {
    console.log('---------------------------- registerAsOperator');
    const operatorInfo = {
      address: worker.ecdsaWallet.address, // todo
      earningsReceiverAddress: cfg.earningsReceiver === "" ? worker.ecdsaWallet.address : cfg.earningsReceiver,
      delegationApproverAddress: cfg.delegationApprover,
      stakerOptOutWindowBlocks: 0,// todo
      metadataUrl: cfg.metadataURI,
    };
    console.log(operatorInfo);
    await worker.clients.elClient.registerAsOperator(operatorInfo);
  }
  {
    console.log('---------------------------- el get');
    const isRegistered = await worker.clients.elClient.isOperatorRegistered(worker.ecdsaWallet.address);
    console.log('isRegistered', isRegistered);

    const isFrozen = await worker.clients.elClient.operatorIsFrozen(worker.ecdsaWallet.address);
    console.log('isFrozen', isFrozen);
  }
  {
    console.log('---------------------------- avs register [0,1]');
    const salt = ethers.utils.hexlify(ethers.utils.randomBytes(32));
    const expiry = Math.floor(Date.now() / 1000) + cfg.operatorSignatureExpirySeconds;
    const blsPrivateKey = await getPrivateKey(cfg.blsKeyFile, cfg.blsKeyPass);
    const quorumNumbers = [0, 1];
    const socket = cfg.operatorSocketIpPort;

    await worker.clients.avsClient.registerOperatorInQuorumWithAVSRegistryCoordinator(
      salt,
      expiry,
      blsPrivateKey,
      quorumNumbers,
      socket,
    );
  }
  {
    console.log('---------------------------- avs get');
    const operatorId = await worker.clients.avsClient.getOperatorId(worker.ecdsaWallet.address);
    console.log('operatorId', operatorId);

    const operator = await worker.clients.avsClient.getOperatorFromId(operatorId);
    console.log('operator', operator);

    const isRegistered = await worker.clients.avsClient.isOperatorRegistered(operator);
    console.log('isRegistered', isRegistered);

    const quorumStakes = await worker.clients.avsClient.getOperatorStakeInQuorumsOfOperatorAtCurrentBlock(operatorId);
    console.log('quorumStakes', quorumStakes);
  }
  {
    console.log('---------------------------- avs deregister 0');
    const quorumNumbers = [0];
    await worker.clients.avsClient.deregisterOperator(quorumNumbers);

    const isRegistered = await worker.clients.avsClient.isOperatorRegistered(worker.ecdsaWallet.address);
    console.log('isRegistered', isRegistered);
  }
  {
    console.log('---------------------------- avs deregister 1');
    const quorumNumbers = [1];
    await worker.clients.avsClient.deregisterOperator(quorumNumbers);

    const isRegistered = await worker.clients.avsClient.isOperatorRegistered(worker.ecdsaWallet.address);
    console.log('isRegistered', isRegistered);
  }

  {
    nodeApi.start(cfg.nodeNodeApiPort);
    metrics.start(cfg.nodeMetricsPort);
  }
  {
    runWorker(worker);
    runWorker([worker, worker]);
  }
}
if (require.main === module) {
  test();
}