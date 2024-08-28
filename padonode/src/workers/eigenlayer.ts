/**
 * Worker: EigenLayer
 */
import { Logger } from "pino";
import { ethers } from "ethers";
import { getPrivateKey, stringToUint8Array, Uint8ArrayToString } from "../utils";
import { WorkerConfig } from "./config";
import { NodeApi } from "../nodeapi";
import { Registry } from 'prom-client';
import { MiscMetrics } from "../metrics/miscmetrics";
import { EigenMetrics } from "../metrics/eigenmetrics";
import { Collector as RpcCollector } from "../metrics/collectors/rpc-calls/rps-calls";
import { Collector as EconomicsCollector } from "../metrics/collectors/economic/economics";
import { AbstractWorker, ChainType } from "./types";
import { RegisterParams, RegisterResult, DeregisterParams, DeregisterResult, UpdateParams, UpdateResult } from "./types";
import { DoTaskParams, DoTaskResult } from "./types";
import { buildPadoClient, PadoClient } from "../clients/pado";
import { readFileSync } from "node:fs";
import { createDataItemSigner } from "@permaweb/aoconnect";
import Arweave from "arweave";
import { reencrypt_v2 } from "../crypto/lhe";
import { buildStorageClient, StorageClient, StorageType } from "../clients/storage";
import * as dotenv from "dotenv";
//@ts-ignore
import { randomInt } from "node:crypto";
import { everPayBalance } from "../misc/everpay";
import { buildELClient, ELClient } from "../clients/eigenlayer";
import { AvsClient, buildAvsClient } from "../clients/avs";
dotenv.config();


interface TaskStatistics {
  successCount: number,
  failedCount: number,
};

interface TaskState {
  /** the id of this task */
  taskId: string,
  /** how many times failed */
  failedCount: number,
  /** set when reportResult failed */
  resultContent: string,
};

export class EigenLayerWorker extends AbstractWorker {
  ecdsaWallet!: ethers.Wallet
  elClient!: ELClient;
  avsClient!: AvsClient;
  padoClient!: PadoClient;
  storageClient!: StorageClient;
  eigenMetrics!: EigenMetrics;
  economicsCollector!: EconomicsCollector;
  lheKey!: any;
  arWallet!: any;
  arSigner!: any;
  arweave!: any;
  taskStates: Map<string, TaskState>;
  taskStatistics: TaskStatistics;
  lastUpdateBalanceTime: number;

  constructor(chainType: ChainType = ChainType.Ethereum) {
    super();
    this.chainType = chainType;
    this.taskStates = new Map();
    this.taskStatistics = { successCount: 0, failedCount: 0 };
    this.lastUpdateBalanceTime = 0;
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
        const pkTransactionId = await this.storageClient.submitData(pkData);
        console.log('pkTransactionId ', pkTransactionId);
        const pkTransactionIdHex = ethers.utils.hexlify(stringToUint8Array(pkTransactionId));
        console.log('pkTransactionIdHex ', pkTransactionIdHex);
        publicKeys.push(pkTransactionIdHex);
      }

      const res = await this.avsClient.registerOperatorInQuorumWithAVSWorkerManager(
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

  async deregister(params: DeregisterParams): Promise<DeregisterResult> {
    console.log('deregister params', params);

    try {
      // @ts-ignore
      const name = params.name;
      const quorums = params.extraData ? params.extraData["quorums"] : [0]; // todo: failed if not set
      const quorumNumbers = quorums;

      const res = await this.avsClient.deregisterOperatorWithAVSWorkerManager(quorumNumbers);
      console.log(`deregister res=${res}`);
    } catch (e) {
      console.log("deregister exception:", e);
    }

    return Promise.resolve({});
  }
  async update(params: UpdateParams): Promise<UpdateResult> {
    console.log('update params', params);
    return Promise.resolve({});
  }

  private async _updateBalanceMetrics() {
    // query balance at least every 15s
    if (Date.now() - this.lastUpdateBalanceTime < 15 * 1000) return;
    this.lastUpdateBalanceTime = Date.now();

    {
      const tokenShow = "ETH(EverPay)";
      const results = await everPayBalance(this.ecdsaWallet.address, "ETH");
      for (const res of results) {
        if (res.chain === "ethereum" && res.symbol === "ETH") {
          this.miscMetrics.setBalanceTotal(Number(res.balance), tokenShow);
        }
      }
    }

    {
      const tokenShow = "ETH(Earned)";
      const res = await this.padoClient.getBalance(this.ecdsaWallet.address, 'ETH');
      this.miscMetrics.setBalanceTotal(Number(res.free) / 1.0e18, tokenShow);
    }
    {
      const tokenShow = "ETH";
      const ethProvider = new ethers.providers.JsonRpcProvider(this.cfg.ethRpcUrl);
      const ethBalance = await ethProvider.getBalance(this.ecdsaWallet.address);
      console.log('ethBalance  ', Number(ethBalance));
      this.miscMetrics.setBalanceTotal(Number(ethBalance) / 1.0e18, tokenShow);
    }
  }

  private async _updateMiscMetrics() {
    this._updateBalanceMetrics();
    {
      const taskType = "EL.DataSharing";
      this.miscMetrics.setTaskSuccessCount(this.taskStatistics.successCount, taskType);
      this.miscMetrics.setTaskFailedCount(this.taskStatistics.failedCount, taskType);
    }
  }

  async doTask(_params: DoTaskParams): Promise<DoTaskResult> {
    await this._updateMiscMetrics();

    // console.log('doTask params', params);
    try {
      await this._doTask();
    } catch (e) {
      console.log("doTask exception:", e);
    }

    return Promise.resolve({});
  }

  private async _getWorkId(): Promise<string> {
    return await this.avsClient.getOperatorId(this.ecdsaWallet.address);
  }


  private async _doTask() {
    // @todo split this function
    const workerId = await this._getWorkId();
    if (workerId === "0x0000000000000000000000000000000000000000000000000000000000000000") {
      this.logger.warn(`cannot get worker id by ${this.ecdsaWallet.address}`);
      return;
    }
    this.logger.info(`workerId: ${workerId}`);

    const tasks = await this.padoClient.getPendingTasksByWorkerId(workerId);
    // console.log('getPendingTasksByWorkerId', tasks);
    this.logger.info(`tasks.length: ${tasks.length}`);

    // For some valid reason, such task timeout, can not get pending tasks, delete the task from taskState
    let _tasks = Array.from(this.taskStates.keys());
    for (const _task of _tasks) {
      let rmFlag = true;
      for (const task of tasks) {
        if (_task === task.taskId) {
          rmFlag = false;
          break;
        }
      }
      if (rmFlag && this.taskStates.has(_task)) {
        this.logger.info(`remove taskId:${_task} from taskStates, which not in getPendingTasksByWorkerId.`)
        this.taskStates.delete(_task);
      }
    }

    // scan all tasks
    for (const task of tasks) {
      // Task State
      if (!this.taskStates.has(task.taskId)) {
        this.taskStates.set(task.taskId, {
          taskId: task.taskId,
          failedCount: 0,
          resultContent: "",
        });
      }
      const taskState = this.taskStates.get(task.taskId) as TaskState;
      if (taskState.failedCount > 0) {
        const retries = 3;
        if (taskState.failedCount == retries + 1) {
          this.taskStatistics.failedCount += 1;
        }
        if (taskState.failedCount > retries) {
          continue;
        }
        this.logger.warn(`task.taskId: ${task.taskId} failed counts: ${taskState.failedCount}`);
      }

      const task_beg = Date.now();
      try {
        this.rpcCollector.addRpcRequestTotal("doTask", '1.0');
        this.logger.info({
          taskId: task.taskId,
          taskType: task.taskType,
          dataId: task.dataId,
          workerIds: task.computingInfo.workerIds,
          computingPrice: task.computingInfo.price,
        }, 'taskInfo');
        // console.log('task.computingInfo', task.computingInfo);

        let resultContent = taskState.resultContent;
        if (resultContent === "") {
          // get data from arweave
          const dataInfo = await this.padoClient.getDataById(task.dataId);
          // console.log('dataInfo', dataInfo);
          const dataIdArr = ethers.utils.arrayify(dataInfo.dataContent);
          const dataTansactionId = Uint8ArrayToString(dataIdArr);
          this.logger.info({
            taskId: task.taskId,
            dataId: dataInfo.dataId,
            dataContent: dataInfo.dataContent,
            dataTansactionId: dataTansactionId,
          }, 'dataInfo');
          const enc_data = await this.storageClient.fetchData(dataTansactionId);
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
            const dataIdArr = ethers.utils.arrayify(task.consumerPk);
            const consumerPkTransactionId = Uint8ArrayToString(dataIdArr);
            this.logger.info({
              taskId: task.taskId,
              consumerPkContent: task.consumerPk,
              consumerPkTransactionId: consumerPkTransactionId,
            }, 'consumerPk');
            const pkData = await this.storageClient.fetchData(consumerPkTransactionId);
            consumer_pk = Buffer.from(pkData).toString('hex');
          }

          const reenc_sk = reencrypt_v2(enc_sk_index + 1, node_sk, consumer_pk, enc_data);
          // console.log("reencrypt reenc_sk=", reenc_sk);

          // update result to arweave
          const resultTransactionId = await this.storageClient.submitData(reenc_sk);
          resultContent = ethers.utils.hexlify(stringToUint8Array(resultTransactionId));
          this.logger.info({
            taskId: task.taskId,
            resultContent: resultContent,
            resultTransactionId: resultTransactionId,
          }, 'result');

          // set resultContent, if failed on reportResult
          taskState.resultContent = resultContent;
        } else {
          // if has set resultContent, we can directly run from here
          this.logger.info(`taskId:${task.taskId} directly reportResult with resultContent:${resultContent}`);
        }

        // report result
        const gasLimit = (400000).toString();
        const res = await this.padoClient.reportResult(task.taskId, workerId, resultContent, gasLimit);
        if (res == null) {// Failed
          taskState.failedCount += 1;
        } else { // OK
          const task_interval = (Date.now() - task_beg) / 1000;
          this.rpcCollector.observeRpcRequestDurationSeconds(task_interval, "doTask", '1.0');

          // remove the state if success
          this.taskStates.delete(task.taskId);

          this.taskStatistics.successCount += 1;
        }
      } catch (error) {
        console.log('task.task', task.taskId, 'with error', error)
        taskState.failedCount += 1;
      }
    }
  }
};

export async function newEigenLayerWorker(cfg: WorkerConfig, logger: Logger, nodeApi: NodeApi, registry: Registry, miscMetrics: MiscMetrics): Promise<EigenLayerWorker> {
  const worker = new EigenLayerWorker(ChainType.Holesky);
  worker.logger = logger;
  worker.nodeApi = nodeApi;
  worker.registry = registry;
  worker.miscMetrics = miscMetrics;

  // init something special
  const rpcCollector = new RpcCollector('eigen', cfg.avsName, registry);
  worker.rpcCollector = rpcCollector;


  // Clients
  const ethProvider = new ethers.providers.JsonRpcProvider(cfg.ethRpcUrl);
  const ecdsaPrivateKey = await getPrivateKey(cfg.ecdsaKeyFile, cfg.ecdsaKeyPass);
  const ecdsaWallet = new ethers.Wallet(ecdsaPrivateKey, ethProvider);
  worker.ecdsaWallet = ecdsaWallet;

  worker.elClient = await buildELClient(ecdsaWallet, cfg.registryCoordinatorAddress, logger);
  worker.avsClient = await buildAvsClient(ecdsaWallet, cfg.registryCoordinatorAddress, cfg.routerAddress, worker.elClient, logger);
  worker.padoClient = await buildPadoClient(ecdsaWallet, cfg.routerAddress, logger, rpcCollector);

  const lheKey = JSON.parse(readFileSync(cfg.lheKeyPath).toString());
  worker.lheKey = lheKey;

  const dataStorageType = StorageType[cfg.dataStorageTypeEL as keyof typeof StorageType];
  if (dataStorageType == StorageType.ARSEEDING_AR || dataStorageType == StorageType.ARWEAVE) {
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

  worker.storageClient = await buildStorageClient(
    dataStorageType,
    worker.ecdsaWallet,
    worker.arWallet,
    worker.arweave,
    cfg.noPay,
    worker.logger,
    rpcCollector,
  );


  // todo
  const quorumNames = {
    "0": "quorum0",
    "1": "quorum1",
    "2": "quorum2",
    "3": "quorum3",
  };
  // @ts-ignore
  const economicsCollector = new EconomicsCollector(
    worker.elClient,
    worker.avsClient,
    cfg.avsName, logger, worker.ecdsaWallet.address, quorumNames,
    registry);
  worker.economicsCollector = economicsCollector;

  const eigenMetrics = new EigenMetrics(cfg.avsName, logger, registry);
  worker.eigenMetrics = eigenMetrics;

  worker.cfg = cfg;
  return worker;
}