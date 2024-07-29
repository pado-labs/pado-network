/**
 * Worker: AO
 */
import { Logger } from "pino";
import { WorkerConfig } from "./config";
import { NodeApi } from "../nodeapi";
import { Registry } from 'prom-client';

import * as dotenv from "dotenv";
dotenv.config();

import { AbstractWorker, ChainType } from "./types";
import { RegisterParams, RegisterResult, DeregisterParams, DeregisterResult, UpdateParams, UpdateResult } from "./types";
import { DoTaskParams, DoTaskResult } from "./types";
import { initAll } from "./worker";


export class AOWorker extends AbstractWorker {
  constructor(chainType: ChainType = ChainType.AO) {
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


export async function newAOWorker(cfg: WorkerConfig, logger: Logger, nodeApi: NodeApi, registry: Registry): Promise<AOWorker> {
  const worker = new AOWorker(ChainType.Holesky);
  worker.logger = logger;
  worker.nodeApi = nodeApi;
  worker.registry = registry;

  // init something special

  worker.cfg = cfg;
  return worker;
}


async function test() {
  const [cfg, logger, nodeApi, registry] = initAll();
  const worker = await newAOWorker(cfg, logger, nodeApi, registry);
  console.log('typeof worker', typeof worker);
}

if (require.main === module) {
  test();
}
