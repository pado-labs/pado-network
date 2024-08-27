import { initLogger, initServices, runWorker } from "./workers/worker";
import { newAOWorker } from "./workers/ao";
import { newEigenLayerWorker } from "./workers/eigenlayer";

import * as dotenv from "dotenv";
dotenv.config();

import { program } from "commander";
import { WorkerConfig } from "./workers/config";

program
  .option('--lhe-key <PATH>', 'Path to the LHE-key file. Default: env.LHE_KEY_PATH.')

program.parse();
const options = program.opts();
console.log('options', options);

async function main() {
  const cfg = new WorkerConfig();
  if (options.lheKey) { cfg.lheKeyPath = options.lheKey; }

  const logger_services = await initLogger("info", "./logs/services.log");
  const [nodeApi, registry, _] = initServices(cfg, logger_services);

  let workers = [];

  try {
    if (cfg.enableEigenLayer) {
      const logger = await initLogger("info", "./logs/worker.el.log");
      const elWorker = await newEigenLayerWorker(cfg, logger, nodeApi, registry);
      workers.push(elWorker);
    }

    if (cfg.enableAO) {
      const logger = await initLogger("info", "./logs/worker.ao.log");
      const aoWorker = await newAOWorker(cfg, logger, nodeApi, registry);
      workers.push(aoWorker);
    }
  } catch (error) {
    console.log('new worker failed:', error);
    return;
  }

  console.log('workers', typeof workers, workers.length);

  await runWorker(workers);
}

if (require.main === module) {
  main();
}
