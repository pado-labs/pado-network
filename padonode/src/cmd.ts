import { writeFileSync, mkdir } from "node:fs";
import { ethers } from "ethers";
import { getAOWorker, getEigenLayerWorker } from "./workers/worker";
import { WorkerConfig } from "./workers/config";
import { getOptValue, getPrivateKey } from "./utils";
import { generateKey } from "./crypto/lhe";
import { dirname } from "node:path";
import { Command } from "commander";
import { assert } from "node:console";
import { DeregisterParams, RegisterParams, UpdateParams } from "./workers/types";
import { everPayBalance, everPayDeposit } from "./misc/everpay";
const program = new Command();



async function _elRegisterAsOperator(options: any) {
  const [cfg, worker] = await getEigenLayerWorker(options);

  {
    const operatorInfo = {
      address: worker.ecdsaWallet.address, // todo
      earningsReceiverAddress: cfg.earningsReceiver === "" ? worker.ecdsaWallet.address : cfg.earningsReceiver,
      delegationApproverAddress: cfg.delegationApprover,
      stakerOptOutWindowBlocks: 0,//todo
      metadataUrl: cfg.metadataURI,
    };
    console.log(operatorInfo);
    await worker.elClient.registerAsOperator(operatorInfo);
  }
}


async function _registerOperatorInQuorumWithAVSRegistryCoordinator(options: any) {
  const [cfg, worker] = await getEigenLayerWorker(options);

  {
    const salt = ethers.utils.hexlify(ethers.utils.randomBytes(32));
    const expiry = Math.floor(Date.now() / 1000) + cfg.operatorSignatureExpirySeconds;
    const blsPrivateKey = await getPrivateKey(cfg.blsKeyFile, cfg.blsKeyPass);
    const quorums: Uint8Array = options.quorumIdList.split(',').map((i: number) => { return Number(i) });
    const quorumNumbers = Array.from(quorums);
    const socket = cfg.operatorSocketIpPort;

    await worker.avsClient.registerOperatorInQuorumWithAVSRegistryCoordinator(
      salt,
      expiry,
      blsPrivateKey,
      quorumNumbers,
      socket,
    );
  }
}

async function _elRegisterPadoAVS(options: any) {
  const [cfg, worker] = await getEigenLayerWorker(options);
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

async function _elDeregisterPadoAVS(options: any) {
  const [cfg, worker] = await getEigenLayerWorker(options);
  const quorums: Uint8Array = options.quorumIdList.split(',').map((i: number) => { return Number(i) });

  let name = cfg.nodeName;
  if (options.name && options.name !== "") { name = options.name; }
  let extraData = {
    "quorums": quorums
  };
  let params = {
    name: name,
    extraData: extraData,
  } as DeregisterParams;
  console.log('params', params);

  const res = await worker.deregister(params);
  console.log('res', res);
}

async function _elGetOperatorId(options: any) {
  const [_, worker] = await getEigenLayerWorker(options);

  {
    if (!options.operator) { options.operator = worker.ecdsaWallet.address; }
    const operatorId = await worker.avsClient.getOperatorId(options.operator);
    console.log('operatorId', operatorId);
  }
}

async function _elAddToWhiteList(options: any) {
  const [_, worker] = await getEigenLayerWorker(options);

  {
    if (!options.operator) { options.operator = worker.ecdsaWallet.address; }
    await worker.padoClient.addWhiteListItem(options.operator);
  }
}

async function _everPayBalance(options: any) {
  console.log(`Get the asset balance on everPay. account: ${options.account} symbol: ${options.symbol ? options.symbol : "ALL"}.`);
  const results = await everPayBalance(options.account, options.symbol);
  if (results.length > 0) {
    console.log('results:', results);
  }
}
async function _ethBalance(options: any) {
  const cfg = new WorkerConfig();
  const ethProvider = new ethers.providers.JsonRpcProvider(cfg.ethRpcUrl);
  const ethbalance = await ethProvider.getBalance(options.account);
  console.log(`account: ${options.account} ethereum balance: ${ethbalance}`);
}
async function _workerBalance(options: any) {
  const [_, worker] = await getEigenLayerWorker(options);

  if (!options.account) { options.account = worker.ecdsaWallet.address; }
  const res = await worker.padoClient.getBalance(options.account, options.symbol);
  console.log(`account: ${options.account} symbol: ${options.symbol} worker balance free:${res.free}, locked:${res.locked}`);
}
async function _workerWithdraw(options: any) {
  const [_, worker] = await getEigenLayerWorker(options);

  if (!options.account) { options.account = worker.ecdsaWallet.address; }
  const res = await worker.padoClient.getBalance(options.account, options.symbol);
  const workerBalance = Number(res.free);
  let withdrawAmount = workerBalance;
  if (withdrawAmount == 0) {
    console.error(`Insufficient free balance. Max free balance: ${workerBalance}`);
    return;
  }

  if (options.amount) {
    withdrawAmount = Number(options.amount);
    if (withdrawAmount > workerBalance) {
      console.error(`Insufficient free balance. Max free balance: ${workerBalance}`);
      return;
    }
    console.log(`withdraw free balance: ${withdrawAmount}`);
  } else {
    console.log(`withdraw all free balance: ${withdrawAmount}`);
  }

  await worker.padoClient.withdrawToken(options.account, options.symbol, withdrawAmount);
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
  const [cfg, worker] = await getAOWorker(options);

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
  const [cfg, worker] = await getAOWorker(options);

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
  const [cfg, worker] = await getAOWorker(options);

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
    .action((options) => { _elRegisterPadoAVS(options); });

  program.command('el:update')
    .description('(UNSUPPORTED).')
    .action((options) => { _empty(options); });

  program.command('el:deregister')
    .description('Deregister to PADO AVS.')
    .requiredOption('--quorum-id-list <ID>', 'quorum number, split by comma. e.g.: 0/1/0,1', '0')
    .action((options) => { _elDeregisterPadoAVS(options); });


  // EigenLayer (Extends)
  program.command('el:register-as-operator')
    .description('Register as Operator on EigenLayer')
    .action((options) => { _elRegisterAsOperator(options); });

  program.command('el:get-operator-id')
    .description('Get the Operator Id.')
    .option('--operator <ADDRESS>', 'the operator address')
    .action((options) => { _elGetOperatorId(options); });

  program.command('el:add-to-white-list')
    .description('Add worker to white list.(only WorkerMgt contract owner)')
    .option('--operator <ADDRESS>', 'the operator address')
    .action((options) => { _elAddToWhiteList(options); });

  program.command('register:avs')
    .description('Register to AVS.')
    .requiredOption('--quorum-id-list <ID>', 'quorum number, split by comma. e.g.: 0/1/0,1')
    .action((options) => { _registerOperatorInQuorumWithAVSRegistryCoordinator(options); });


  // Misc/Tool/Util
  program.command('eth:balance')
    .description('eth balance')
    .requiredOption('--account <ACCOUNT_ADDRESS>', 'Account address.')
    .action((options) => { _ethBalance(options); });

  program.command('worker:balance')
    .description('worker balance')
    .requiredOption('--symbol <SYMBOL>', 'Token symbol, such as ETH.', 'ETH')
    .action((options) => { _workerBalance(options); });

  program.command('worker:withdraw')
    .description('worker withdraw')
    .option('--amount <AMOUNT>', 'Amount of assets to be withdraw. Default withdraw all free balance')
    .requiredOption('--symbol <SYMBOL>', 'Token symbol, such as ETH.', 'ETH')
    .action((options) => { _workerWithdraw(options); });

  program.command('everpay:balance')
    .description('EverPay balance')
    .requiredOption('--account <ACCOUNT_ADDRESS>', 'Account address.')
    .option('--symbol <SYMBOL>', 'Token symbol, such as ETH.')
    .action((options) => { _everPayBalance(options); });


  program.command('everpay:deposit')
    .description('EverPay Deposit')
    .requiredOption('--chain <CHAIN_TYPE>', 'Chain type. Now only supported ethereum and arweave.')
    .requiredOption('--symbol <SYMBOL>', 'Token symbol, such as ETH.')
    .requiredOption('--amount <AMOUNT>', 'Amount of assets to be deposit')
    .option('--walletpath <PATH>', 'The wallet path. You should export WALLET_PATH=/path/to/your/wallet.json while using docker.')
    .action((options) => {
      if (getOptValue(process.env.EXECUTION_FLAG, "") === "DOCKER") {
        options.walletpath = "/pado-network/keys/wallet.json";
      } else {
        if (!options.walletpath) {
          const walletpath = getOptValue(process.env.WALLET_PATH, "");
          if (walletpath === "") {
            console.log("please pass wallet path by --walletpath=... or export WALLET_PATH=...");
            return;
          }
          options.walletpath = walletpath;
        }
      }
      everPayDeposit(options.chain, options.symbol, options.amount, options.walletpath);
    });

  await program.parseAsync(process.argv);
}
main()

