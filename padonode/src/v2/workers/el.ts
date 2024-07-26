import { pino, Logger } from "pino";
import { ethers } from "ethers";
import { BuildAllConfig, buildAll, Clients } from "../clients/builder";
import { getPrivateKey } from "../utils";
import { WorkerConfig } from "../config";
import * as dotenv from "dotenv";
dotenv.config();

export class ELWorker {
  cfg!: WorkerConfig;
  logger!: Logger;
  ecdsaWallet!: ethers.Wallet
  clients!: Clients;
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

  // Metrics

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

}
if (require.main === module) {
  test();
}