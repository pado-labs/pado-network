/**
 * Worker: AO
 */
import { Logger } from "pino";
import { WorkerConfig } from "./config";
import { NodeApi } from "../nodeapi";
import { Registry } from 'prom-client';
import { AbstractWorker, ChainType } from "./types";
import { RegisterParams, RegisterResult, DeregisterParams, DeregisterResult, UpdateParams, UpdateResult } from "./types";
import { DoTaskParams, DoTaskResult } from "./types";
import { initAll } from "./worker";
import { AOClient, buildAOClient } from "../clients/ao";
import { reencrypt } from "../crypto/lhe";
import { readFileSync } from "node:fs";
import { createDataItemSigner } from "@permaweb/aoconnect";
import Arweave from "arweave";
import { buildStorageClient, StorageClient, StorageType } from "../clients/storage";
import { ethers } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();


interface TaskState {
  /** the id of this task */
  taskId: string,
  /** how many times failed */
  failedCount: number,
  /** set when reportResult failed */
  resultContent: string,
};

export class AOWorker extends AbstractWorker {
  aoClient!: AOClient;
  storageClient!: StorageClient;
  lheKey!: any;
  arWallet!: any;
  arSigner!: any;
  arweave!: any;
  taskStates: Map<string, TaskState>;

  constructor(chainType: ChainType = ChainType.AO) {
    super();
    this.chainType = chainType;
    this.taskStates = new Map();
  }

  async register(params: RegisterParams): Promise<RegisterResult> {
    console.log('register params', params);

    const name = params.name;
    const desc = params.description;
    // @todo: params.taskTypeConfig??
    try {
      const res = await this.aoClient.registerNode(name, this.lheKey.pk, desc, this.arSigner);
      console.log(`registerNode res=${res}`);
    } catch (e) {
      console.log("registerNode exception:", e);
    }

    return Promise.resolve({});
  }

  async deregister(params: DeregisterParams): Promise<DeregisterResult> {
    console.log('deregister params', params);

    const name = params.name;
    try {
      const res = await this.aoClient.deleteNode(name, this.arSigner);
      console.log(`deleteNode res=${res}`);
    } catch (e) {
      console.log("deleteNode exception:", e);
    }

    return Promise.resolve({});
  }

  async update(params: UpdateParams): Promise<UpdateResult> {
    console.log('update params', params);

    const name = params.name;
    const desc = params.description;
    // @todo: params.taskTypeConfig??
    try {
      const res = await this.aoClient.updateNode(name, desc, this.arSigner);
      console.log(`updateNode res=${res}`);
    } catch (e) {
      console.log("updateNode exception:", e);
    }

    return Promise.resolve({});
  }

  async doTask(_params: DoTaskParams): Promise<DoTaskResult> {
    // console.log('doTask params', params);

    try {
      // @todo get the name outside
      let name = await this._getNodeName(this.lheKey.pk);
      if (name == "") {
        return {};
      }

      await this._doTask(name, this.lheKey.sk, this.arSigner);
    } catch (e) {
      console.log("doTask exception:", e);
    }

    return Promise.resolve({});
  }

  /**
   *
   * Do task
   *
   * 1. fetch pending task(s)
   * 2. do reencrypt
   * 3. submit result
   *
   * @param name - the node name
   * @param sk - the node secert key
   */
  private async _doTask(name: string, sk: string, signer: any) {
    /// 1. fetch pending task(s)
    const pendingTasks = await this.aoClient.getPendingTasks();
    let pendingTasksObj = Object();
    try {
      pendingTasksObj = JSON.parse(pendingTasks);
      this.logger.info(`tasks.length: ${pendingTasksObj.length}`);
    } catch (e) {
      console.log("getPendingTasks JSON.parse(pendingTasks) exception:", e);
      return;
    }

    // For some valid reason, such task timeout, can not get pending tasks, delete the task from taskState
    let _tasks = Array.from(this.taskStates.keys());
    for (const _task of _tasks) {
      let rmFlag = true;
      for (const i in pendingTasksObj) {
        var task = pendingTasksObj[i];
        const taskId = task["id"];
        if (_task === taskId) {
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
    // console.log("doTask pendingTasks=", pendingTasks);
    for (const i in pendingTasksObj) {
      // console.log("doTask DateTime:", new Date());

      var task = pendingTasksObj[i];
      // console.log("doTask task=", task);

      const taskId = task["id"];
      this.logger.info(`task.taskId: ${taskId}`);


      // Task State
      if (!this.taskStates.has(taskId)) {
        this.taskStates.set(taskId, {
          taskId: taskId,
          failedCount: 0,
          resultContent: "",
        });
      }
      const taskState = this.taskStates.get(taskId) as TaskState;
      if (taskState.failedCount > 0) {
        if (taskState.failedCount > 10) {
          continue;
        }
        this.logger.warn(`task.taskId: ${taskId} failed counts: ${taskState.failedCount}`);
      }

      try {
        var inputData = task["inputData"]
        var inputDataObj = JSON.parse(inputData);
        // console.log("doTask inputData=", inputData);

        var dataId = inputDataObj["dataId"];
        this.logger.info(`task.dataId: ${dataId}`);

        const dataRes = await this.aoClient.getDataById(dataId);
        let dataResObj = Object();
        let exData = Object();
        try {
          dataResObj = JSON.parse(dataRes);
          exData = JSON.parse(dataResObj.data);
        } catch (e) {
          console.log("getDataById JSON.parse(dataRes) exception:", e);
          throw e;
        }
        let policy = exData.policy;
        let indices = exData.policy.indices;
        let names = exData.policy.names;
        if (indices.length != names.length) {
          console.log(`indices.length(${indices.length}) != names.length(${names.length})`);
          throw 'invalid length of indices and names';
        }
        this.logger.info(policy, 'policy');

        // console.log("doTask Data=", dataResObj);
        {
          var encSksObj = exData["encSks"];
          let encSk = "";
          for (var k = 0; k < names.length; k++) {
            if (names[k] == name) {
              encSk = encSksObj[indices[k] - 1];
              break;
            }
          }

          if (encSk == "") {
            this.logger.warn("can not found nodename:", name);
            throw 'can not found nodename';
          }

          /// 2. do reencrypt
          var threshold = { t: policy.t, n: policy.n, indices: policy.indices };
          const enc_sk = encSk;
          const node_sk = sk;
          const consumer_pk = inputDataObj["consumerPk"];
          const reencsksObj = reencrypt(enc_sk, node_sk, consumer_pk, threshold);
          if (reencsksObj && reencsksObj.reenc_sk) {
            this.logger.info(`reencsksObj.reenc_sk.length: ${reencsksObj.reenc_sk.length}`);
          }
          var reencsks = JSON.stringify(reencsksObj);
          // console.log("reencsks res=", typeof reencsks);
          // console.log("signer res=", typeof signer);

          /// 3. submit result
          const res = await this.aoClient.reportResult(taskId, name, reencsks, signer);
          this.logger.info(`reportResult res: ${res}`);

          // remove the state if success
          this.taskStates.delete(taskId);
        }
      } catch (error) {
        console.log('task.taskId', taskId, 'with error', error)
        taskState.failedCount += 1;
      }
    }

  }

  /**
  *
  * Get node name by public key
  *
  * @param pk - the node public key
  */
  private async _getNodeName(pk: string): Promise<string> {
    let nodesObj = Object();
    try {
      let nodesres = await this.aoClient.nodes();
      nodesObj = JSON.parse(nodesres);
    } catch (e) {
      console.error("getNodeName nodes() exception:", e);
      return "";
    }

    for (let i in nodesObj) {
      const node = nodesObj[i];
      if (node.publickey == pk) {
        return node.name;
      }
    }

    this.logger.error("getNodeName cannot found node name by public key, please register node public key first.");
    return "";
  }

};


export async function newAOWorker(cfg: WorkerConfig, logger: Logger, nodeApi: NodeApi, registry: Registry): Promise<AOWorker> {
  const worker = new AOWorker(ChainType.Holesky);
  worker.logger = logger;
  worker.nodeApi = nodeApi;
  worker.registry = registry;

  // init something special
  worker.aoClient = await buildAOClient(cfg.aoDataRegistryProcessId, cfg.aoNodeRegistryProcessId, cfg.aoTasksProcessId, logger);

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
  } else {
    throw "unsupported!";
  }

  const _emptyEcdsaWallet = ethers.Wallet.createRandom();
  worker.storageClient = await buildStorageClient(
    dataStorageType,
    _emptyEcdsaWallet,
    worker.arWallet,
    worker.arweave,
    cfg.noPay,
    worker.logger,
  );

  worker.cfg = cfg;
  return worker;
}


async function test() {
  const [cfg, logger, nodeApi, registry] = initAll();
  const worker = await newAOWorker(cfg, logger, nodeApi, registry);
  console.log('typeof worker', typeof worker);

  // register
  await worker.register({
    name: "test1",
    description: "test1's description",
    taskTypeConfig: [],
  } as RegisterParams);

}

if (require.main === module) {
  test();
}
