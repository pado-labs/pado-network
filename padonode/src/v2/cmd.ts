import { writeFileSync } from "node:fs";
import { ethers } from "ethers";
import { newEigenLayerWorker } from "./workers/eigenlayer";
import { initAll } from "./workers/worker";
import { WorkerConfig } from "./workers/config";
import { getPrivateKey } from "./utils";
import { generateKey } from "./crypto/lhe";

import { Command } from "commander";
import { assert } from "node:console";
const program = new Command();

async function _getWorker(options: any): Promise<[WorkerConfig, any]> {
  console.log('options', options);

  const [cfg, logger, nodeApi, registry, _] = initAll();
  const worker = await newEigenLayerWorker(cfg, logger, nodeApi, registry);

  return [worker.cfg, worker];
}


async function _registerAsOperator(options: any) {
  const [cfg, worker] = await _getWorker(options);

  {
    const operatorInfo = {
      address: worker.ecdsaWallet.address, // todo
      earningsReceiverAddress: cfg.earningsReceiver === "" ? worker.ecdsaWallet.address : cfg.earningsReceiver,
      delegationApproverAddress: cfg.delegationApprover,
      stakerOptOutWindowBlocks: 0,//todo
      metadataUrl: cfg.metadataURI,
    };
    console.log(operatorInfo);
    await worker.clients.elClient.registerAsOperator(operatorInfo);
  }
}

async function _registerOperatorInQuorumWithAVSRegistryCoordinator(options: any) {
  const [cfg, worker] = await _getWorker(options);

  {
    const salt = ethers.utils.hexlify(ethers.utils.randomBytes(32));
    const expiry = Math.floor(Date.now() / 1000) + cfg.operatorSignatureExpirySeconds;
    const blsPrivateKey = await getPrivateKey(cfg.blsKeyFile, cfg.blsKeyPass);
    const quorums: Uint8Array = options.quorumIdList.split(',').map((i: number) => { return Number(i) });
    const quorumNumbers = Array.from(quorums);
    const socket = cfg.operatorSocketIpPort;

    await worker.clients.avsClient.registerOperatorInQuorumWithAVSRegistryCoordinator(
      salt,
      expiry,
      blsPrivateKey,
      quorumNumbers,
      socket,
    );
  }
}

async function _getOperatorId(options: any) {
  const [_, worker] = await _getWorker(options);

  {
    if (!options.operator) { options.operator = worker.ecdsaWallet.address; }
    const operatorId = await worker.clients.avsClient.getOperatorId(options.operator);
    console.log('operatorId', operatorId);
  }
}

async function _geneateLHEKey(options: any) {
  console.log('options', options);
  const keyPath = options.output;
  const n = Number(options.n);
  const t = Number(options.t);
  assert(n >= 3, "n >= 3");
  assert(t >= 1, "t >= 1");
  assert(n >= t, "n >= t");

  {
    const key = await generateKey({ n: n, t: t });
    writeFileSync(keyPath, JSON.stringify(key));
    console.log(`The key has been stored into ${keyPath}.`);
  }
}

async function main() {
  program.command('register-as-operator')
    .description('Register as Operator on EigenLayer')
    .requiredOption('--chain <NAME>', 'blockchain(unsupported now)', 'holesky')
    .action((options) => { _registerAsOperator(options); });

  program.command('register')
    .description('Register to AVS.')
    .requiredOption('--chain <NAME>', 'blockchain(unsupported now)', 'holesky')
    .requiredOption('--quorum-id-list <ID>', 'quorum number, split by comma. e.g.: 0/1/0,1')
    .action((options) => { _registerOperatorInQuorumWithAVSRegistryCoordinator(options); });

  program.command('get-operator-id')
    .description('Get the Operator Id.')
    .option('--operator <ADDRESS>', 'the operator address')
    .action((options) => { _getOperatorId(options); });

  program.command('generate-lhe-key')
    .description('Generate LHE Keys.')
    .option('--output <FILEPATH>', 'JSON file path to store the keys', "lhe.key.json")
    .option('--n <TOTAL>', 'total number', '3')
    .option('--t <THRESHOLD>', 'threshold number', '2')
    .action((options) => { _geneateLHEKey(options); });

  await program.parseAsync(process.argv);
}
main()

