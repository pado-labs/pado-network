import { pino, Logger } from "pino";
import { WorkerConfig } from "./config";
import { NodeApi } from "../nodeapi";
import { Registry } from 'prom-client';
import { Metrics } from "../metrics/metrics";
import { DoTaskParams, IWorker } from "./types";
import { createWriteStream, mkdir } from "node:fs";
import * as dotenv from "dotenv";
import { stdout } from "node:process";
import { dirname } from "node:path";
dotenv.config();


// @TODO remove this
export function initAll_transport(): [WorkerConfig, Logger, NodeApi, Registry, Metrics] {
  const cfg = new WorkerConfig();
  mkdir(dirname(cfg.logFile), { recursive: true }, (err) => { if (err) throw err; });
  const transport = pino.transport({
    targets: [{
      level: cfg.logLevel,
      target: 'pino/file',
      options: { destination: cfg.logFile, mkdir: true, append: true }
    }]
  })
  const logger = pino(transport);
  const nodeApi = new NodeApi(cfg.nodeName, cfg.nodeVersion);
  const registry = new Registry();
  const metrics = new Metrics(logger, registry);

  return [cfg, logger, nodeApi, registry, metrics];
};

export async function initLogger(logLevel: string, logFile: string): Promise<Logger> {
  await mkdir(dirname(logFile), { recursive: true }, (err) => { if (err) throw err; });
  const streams = [
    { level: 'debug', stream: stdout },
    { level: 'info', stream: createWriteStream(logFile, { flags: 'a' }) },
  ];
  const logger = pino({
    base: { pid: undefined, hostname: undefined },
    nestedKey: 'payload',
    level: logLevel,
    timestamp: pino.stdTimeFunctions.isoTime
  }, pino.multistream(streams));

  return logger;
}

export function initServices(cfg: WorkerConfig, logger: Logger): [NodeApi, Registry, Metrics] {
  const nodeApi = new NodeApi(cfg.nodeName, cfg.nodeVersion);
  const registry = new Registry();
  const metrics = new Metrics(logger, registry);

  return [nodeApi, registry, metrics];
}

export function initAll(): [WorkerConfig, Logger, NodeApi, Registry, Metrics] {
  const cfg = new WorkerConfig();
  mkdir(dirname(cfg.logFile), { recursive: true }, (err) => { if (err) throw err; });
  const streams = [
    { level: 'debug', stream: stdout },
    { level: 'info', stream: createWriteStream(cfg.logFile, { flags: 'a' }) },
  ];
  const logger = pino({
    base: { pid: undefined, hostname: undefined },
    nestedKey: 'payload',
    level: cfg.logLevel,
    timestamp: pino.stdTimeFunctions.isoTime
  }, pino.multistream(streams));
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
  }, 2000); // todo, set interval by .env
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

  if (workers.length == 0) {
    console.log('no workers');
    return;
  }

  await _runWorkers(workers);
}

