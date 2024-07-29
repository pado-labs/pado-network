/**
 * Worker: EigenLayer
 */
import { Logger } from "pino";
import { ethers } from "ethers";
import { BuildAllConfig, buildAll, Clients } from "../clients/builder";
import { getPrivateKey } from "../utils";
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


export class EigenLayerWorker extends AbstractWorker {
  ecdsaWallet!: ethers.Wallet
  clients!: Clients;
  eigenMetrics!: EigenMetrics;

  constructor(chainType: ChainType = ChainType.Ethereum) {
    super();
    this.chainType = chainType;
  }

  register(params: RegisterParams): Promise<RegisterResult> {
    console.log('register params', params);
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
  doTask(params: DoTaskParams): Promise<DoTaskResult> {
    console.log('doTask params', params);
    return Promise.resolve({});
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
    ecdsaWallet, logger);
  const clients = await buildAll(config); // todo, no need build all clients
  worker.clients = clients;

  // @ts-ignore
  const rpcCollector = new RpcCollector(cfg.avsName, registry);

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