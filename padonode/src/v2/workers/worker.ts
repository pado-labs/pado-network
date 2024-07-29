import { pino, Logger } from "pino";
import { WorkerConfig } from "./config";
import { NodeApi } from "../nodeapi";
import { Registry } from 'prom-client';
import { Metrics } from "../metrics/metrics";
import { IWorker } from "./types";

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
  console.log('drunWorker worker', worker);
}

