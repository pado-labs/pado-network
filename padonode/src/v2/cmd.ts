import { ethers } from "ethers";
import { newELWorker } from "./workers/el";
import { WorkerConfig } from "./config";
import { getPrivateKey } from './utils';
import { Command } from "commander";
const program = new Command();

async function _getWorker(options: any): Promise<[WorkerConfig, any]> {
  console.log('options', options);

  const cfg = new WorkerConfig();
  // console.log('cfg', cfg);
  const worker = await newELWorker(cfg);
  // console.log('worker', worker);

  return [worker.cfg, worker];
}


async function _registerAsOperator(options: any) {
  const [cfg, worker] = await _getWorker(options);

  {
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

  await program.parseAsync(process.argv);
}
main()

