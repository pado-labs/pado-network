import { pino, Logger } from "pino";
import { ethers } from "ethers";
import { BuildAllConfig, buildAll, Clients } from "../clients/builder";
import { getPrivateKey } from "../utils";
import { WorkerConfig } from "../config";
import { NodeApi } from "../nodeapi";
import { Registry } from 'prom-client';
import { EigenMetrics } from "../metrics/eigenmetrics";
import { Collector as RpcCollector } from "../metrics/collectors/rpc-calls/rps-calls";
import { Collector as EconomicsCollector } from "../metrics/collectors/economic/economics";

import * as dotenv from "dotenv";
dotenv.config();

export class ELWorker {
  cfg!: WorkerConfig;
  logger!: Logger;
  ecdsaWallet!: ethers.Wallet
  clients!: Clients;
  nodeApi!: NodeApi;
  metrics!: EigenMetrics;
  constructor() { }
};

export async function newELWorker(cfg: WorkerConfig): Promise<ELWorker> {
  const worker = new ELWorker();

  // Logger
  const transport = pino.transport({
    targets: [{
      level: "info",
      target: 'pino/file',
      options: { destination: './worker.log' }
    }]
  })
  const logger = pino(transport);
  worker.logger = logger;


  // Clients
  const ethProvider = new ethers.providers.JsonRpcProvider(cfg.ethRpcUrl);
  const ecdsaPrivateKey = await getPrivateKey(cfg.ecdsaKeyFile, cfg.ecdsaKeyPass);
  const ecdsaWallet = new ethers.Wallet(ecdsaPrivateKey, ethProvider);
  worker.ecdsaWallet = ecdsaWallet;
  if (cfg.earningsReceiver === "") {
    cfg.earningsReceiver = ecdsaWallet.address;
  }

  const config = new BuildAllConfig(
    cfg.registryCoordinatorAddress,
    cfg.operatorStateRetrieverAddress,
    ecdsaWallet, logger);
  const clients = await buildAll(config)
  worker.clients = clients;

  // Node API
  const nodeApi = new NodeApi(cfg.nodeName, cfg.nodeVersion);
  worker.nodeApi = nodeApi;

  // Metrics
  const registry = new Registry();

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

  const metrics = new EigenMetrics(cfg.avsName, logger, registry);
  worker.metrics = metrics;


  worker.cfg = cfg;
  return worker;
}


async function test() {
  const cfg = new WorkerConfig();
  // console.log('cfg', cfg);
  const worker = await newELWorker(cfg);
  // console.log('worker', worker);

  {
    console.log('---------------------------- registerAsOperator');
    const operatorInfo = {
      address: worker.ecdsaWallet.address, // todo
      earningsReceiverAddress: cfg.earningsReceiver,
      delegationApproverAddress: cfg.delegationApprover,
      stakerOptOutWindowBlocks: 0,//todo
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
    worker.nodeApi.start(worker.cfg.nodeNodeApiPort);
    worker.metrics.start(worker.cfg.nodeMetricsPort);
  }

}
if (require.main === module) {
  test();
}