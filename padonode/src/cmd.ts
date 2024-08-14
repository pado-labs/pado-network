import { writeFileSync, mkdir } from "node:fs";
import { ethers } from "ethers";
import { newEigenLayerWorker } from "./workers/eigenlayer";
import { initAll } from "./workers/worker";
import { WorkerConfig } from "./workers/config";
import { getPrivateKey } from "./utils";
import { generateKey } from "./crypto/lhe";
import { newAOWorker } from "./workers/ao";
import { dirname } from "node:path";
import { Command } from "commander";
import { assert } from "node:console";
import { DeregisterParams, RegisterParams, UpdateParams } from "./workers/types";
const program = new Command();

async function _getWorker(options: any): Promise<[WorkerConfig, any]> {
  console.log('options', options);

  const [cfg, logger, nodeApi, registry, _] = initAll();
  const worker = await newEigenLayerWorker(cfg, logger, nodeApi, registry);

  // @TODO if enableXXX

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

async function _registerOperatorInQuorumWithAVSWorkerManager(options: any) {
  const [cfg, worker] = await _getWorker(options);
  const quorums: Uint8Array = options.quorumIdList.split(',').map((i: number) => { return Number(i) });

  let name = cfg.nodeName;
  let desc = cfg.nodeDescription;
  if (options.name && options.name !== "") { name = options.name; }
  if (options.desc && options.desc !== "") { desc = options.desc; }
  let extraData = {
    "quorums": quorums
  };
  let params = {
    name: name,
    description: desc,
    taskTypeConfig: [],
    extraData: extraData,
  } as RegisterParams;
  console.log('params', params);

  await worker.register(params);
}

async function _getOperatorId(options: any) {
  const [_, worker] = await _getWorker(options);

  {
    if (!options.operator) { options.operator = worker.ecdsaWallet.address; }
    const operatorId = await worker.clients.avsClient.getOperatorId(options.operator);
    console.log('operatorId', operatorId);
  }
}

async function _elAddToWhiteList(options: any) {
  const [_, worker] = await _getWorker(options);

  {
    if (!options.operator) { options.operator = worker.ecdsaWallet.address; }
    await worker.padoClient.addWhiteListItem(options.operator);
  }
}

async function _geneateLHEKey(options: any) {
  console.log('options', options);
  const keyName = options.keyName;
  const n = 3; // not used
  const t = 2; // not used
  assert(n >= 3, "n >= 3");
  assert(t >= 1, "t >= 1");
  assert(n >= t, "n >= t");

  {
    const keyPath = `./keys/${keyName}.lhe.key.json`;
    await mkdir(dirname(keyPath), { recursive: true }, (err) => { if (err) throw err; });
    const key = await generateKey({ n: n, t: t });
    writeFileSync(keyPath, JSON.stringify(key));
    console.log(`The key has been stored into '${keyPath}'.`);
  }
}

async function _aoRegister(options: any) {
  console.log('options', options);
  const [cfg, logger, nodeApi, registry] = initAll();
  if (options.lheKey) { cfg.lheKeyPath = options.lheKey; }
  const worker = await newAOWorker(cfg, logger, nodeApi, registry);

  let name = cfg.nodeName;
  let desc = cfg.nodeDescription;
  if (options.name && options.name !== "") { name = options.name; }
  if (options.desc && options.desc !== "") { desc = options.desc; }
  let params = {
    name: name,
    description: desc,
    taskTypeConfig: [],
  } as RegisterParams;
  console.log('params', params);

  const res = await worker.register(params);
  console.log('res', res);
}

async function _aoUpdateNaode(options: any) {
  console.log('options', options);
  const [cfg, logger, nodeApi, registry] = initAll();
  const worker = await newAOWorker(cfg, logger, nodeApi, registry);

  let name = cfg.nodeName;
  let desc = cfg.nodeDescription;
  if (options.name && options.name !== "") { name = options.name; }
  if (options.desc && options.desc !== "") { desc = options.desc; }
  let params = {
    name: name,
    description: desc,
    taskTypeConfig: [],
  } as UpdateParams;
  console.log('params', params);

  const res = await worker.update(params);
  console.log('res', res);
}

async function _aoDeregister(options: any) {
  console.log('options', options);
  const [cfg, logger, nodeApi, registry] = initAll();
  const worker = await newAOWorker(cfg, logger, nodeApi, registry);

  let name = cfg.nodeName;
  if (options.name && options.name !== "") { name = options.name; }
  let params = {
    name: name,
  } as DeregisterParams;
  console.log('params', params);

  const res = await worker.deregister(params);
  console.log('res', res);
}

//@ts-ignore
async function _empty(options: any) {
}


async function main() {
  // Keys
  program.command('generate-lhe-key')
    .description('Generate LHE Keys.')
    .requiredOption('--key-name <NAME>', 'Name of the key. Default output to ./keys/[NAME].lhe.key.json', 'default')
    .action((options) => { _geneateLHEKey(options); });


  // AOs
  program.command('ao:register')
    .description('AO Register.')
    .option('--name <NAME>', 'The name of the node. Default: env.NODE_NAME.')
    .option('--desc <DESCRIPTION>', 'The description of the node. Default: env.NODE_DESCRIPTION.')
    .option('--lhe-key <PATH>', 'Path to the LHE-key file. Default: env.LHE_KEY_PATH.')
    .action((options) => { _aoRegister(options); });
  program.command('ao:update')
    .description('AO Update.')
    .option('--name <NAME>', 'The name of the node. Default: env.NODE_NAME.')
    .option('--desc <DESCRIPTION>', 'The description of the node. Default: env.NODE_DESCRIPTION.')
    .action((options) => { _aoUpdateNaode(options); });
  program.command('ao:deregister')
    .description('AO Deregister.')
    .option('--name <NAME>', 'The name of the node. Default: env.NODE_NAME.')
    .action((options) => { _aoDeregister(options); });


  // EigenLayer
  program.command('el:register')
    .description('Register to PADO AVS.')
    .requiredOption('--quorum-id-list <ID>', 'quorum number, split by comma. e.g.: 0/1/0,1', '0')
    .action((options) => { _registerOperatorInQuorumWithAVSWorkerManager(options); });

  program.command('el:update')
    .description('(UNSUPPORTED).')
    .action((options) => { _empty(options); });

  program.command('el:deregister')
    .description('(UNSUPPORTED).')
    .action((options) => { _empty(options); });


  // EigenLayer (Extends)
  program.command('el:register-as-operator')
    .description('Register as Operator on EigenLayer')
    .action((options) => { _registerAsOperator(options); });

  program.command('el:get-operator-id')
    .description('Get the Operator Id.')
    .option('--operator <ADDRESS>', 'the operator address')
    .action((options) => { _getOperatorId(options); });

  program.command('el:add-to-white-list')
    .description('Add worker to white list.(only WorkerMgt contract owner)')
    .option('--operator <ADDRESS>', 'the operator address')
    .action((options) => { _elAddToWhiteList(options); });

  program.command('register:avs')
    .description('Register to AVS.')
    .requiredOption('--quorum-id-list <ID>', 'quorum number, split by comma. e.g.: 0/1/0,1')
    .action((options) => { _registerOperatorInQuorumWithAVSRegistryCoordinator(options); });


  await program.parseAsync(process.argv);
}
main()

