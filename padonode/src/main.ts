import { initLogger, initServices, runWorker } from "./workers/worker";
import { newAOWorker } from "./workers/ao";
import { newEigenLayerWorker } from "./workers/eigenlayer";

import * as dotenv from "dotenv";
dotenv.config();

import { program } from "commander";
import { WorkerConfig } from "./workers/config";
import { MiscMetrics } from "./metrics/miscmetrics";

program
  .option('--lhe-key <PATH>', 'Path to the LHE-key file. Default: env.LHE_KEY_PATH.')

program.parse();
const options = program.opts();
console.log('options', options);

async function main() {
  const cfg = new WorkerConfig();
  if (!cfg.enableEigenLayer && !cfg.enableAO) {
    console.log("enable one/all of [ENABLE_EIGEN_LAYER, ENABLE_AO]");
    return;
  }

  if (options.lheKey) { cfg.lheKeyPath = options.lheKey; }

  const logger_services = await initLogger("info", "./logs/services.log");
  const [nodeApi, registry, metrics] = initServices(cfg, logger_services);
  const miscMetrics = new MiscMetrics(logger_services, registry);

  let workers = [];

  try {
    if (cfg.enableEigenLayer) {
      const logger = await initLogger("info", "./logs/worker.el.log");
      const elWorker = await newEigenLayerWorker(cfg, logger, nodeApi, registry, miscMetrics);
      workers.push(elWorker);
    }

    if (cfg.enableAO) {
      const logger = await initLogger("info", "./logs/worker.ao.log");
      const aoWorker = await newAOWorker(cfg, logger, nodeApi, registry, miscMetrics);
      workers.push(aoWorker);
    }
  } catch (error) {
    console.log('new worker failed:', error);
    return;
  }

  console.log('workers', typeof workers, workers.length);

  if (cfg.nodeEnableMetrics) {
    metrics.start(cfg.nodeMetricsPort);
  }

  await runWorker(workers);
}

if (require.main === module) {
  main();
}
