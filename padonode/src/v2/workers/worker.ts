import { pino, Logger } from "pino";
import { WorkerConfig } from "./config";
import { NodeApi } from "../nodeapi";
import { Registry } from 'prom-client';
import { Metrics } from "../metrics/metrics";
import { DoTaskParams, IWorker } from "./types";

import * as dotenv from "dotenv";
dotenv.config();


export function initAll(): [WorkerConfig, Logger, NodeApi, Registry, Metrics] {
  const cfg = new WorkerConfig();
  const transport = pino.transport({
    targets: [{
      level: "info",
      target: 'pino/file',
      options: { destination: './worker.log' }
    }]
  })
  const logger = pino(transport);
  const nodeApi = new NodeApi(cfg.nodeName, cfg.nodeVersion);
  const registry = new Registry();
  const metrics = new Metrics(logger, registry);

  return [cfg, logger, nodeApi, registry, metrics];
};


async function _runWorkers(workers: IWorker[]) {
  setTimeout(async () => {
    try {
      // todo, set params if necessary
      const doTaskParams = {
        taskTypeConfig: [],
      } as DoTaskParams;

      const workerNums = workers.length;
      for (let i = 0; i < workerNums; i++) {
        // @ts-ignore
        const doTaskResult = await workers[i].doTask(doTaskParams);
      }
    } catch (e) {
      console.log("_runWorkers exception:", e);
    }

    await _runWorkers(workers);
  }, 1000); // todo, set interval by .env
}

/**
 * 
 * @param worker 
 * 
 * ```js
 * const [cfg, logger, nodeApi, registry, metrics] = initAll();
 * const nativeWorker = await newNativeWorker(cfg, logger, nodeApi, registry);
 * const eigenWorker = await newEigenLayerWorker(cfg, logger, nodeApi, registry);
 *
 * //
 * runWorker(nativeWorker);
 * runWorker(eigenWorker);
 * // or
 * runWorker([nativeWorker, eigenWorker]);
 * ```
 */
export async function runWorker(worker: IWorker | IWorker[]) {
  let workers: IWorker[];
  if (worker instanceof Array) {
    workers = worker;
  } else {
    workers = [worker];
  }

  await _runWorkers(workers);
}

