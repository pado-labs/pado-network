import { initAll, runWorker } from "./workers/worker";
import { newAOWorker } from "./workers/ao";
import { newEigenLayerWorker } from "./workers/eigenlayer";

import * as dotenv from "dotenv";
dotenv.config();

import { program } from "commander";
program
  .option('--lhe-key <PATH>', 'Path to the LHE-key file. Default: env.LHE_KEY_PATH.')

program.parse();
const options = program.opts();
console.log('options', options);

async function main() {
  const [cfg, logger, nodeApi, registry, _] = initAll();
  if (options.lheKey) { cfg.lheKeyPath = options.lheKey; }

  let workers = [];

  try {
    if (cfg.enableAO) {
      const aoWorker = await newAOWorker(cfg, logger, nodeApi, registry);
      workers.push(aoWorker);
    }

    if (cfg.enableEigenLayer) {
      const elWorker = await newEigenLayerWorker(cfg, logger, nodeApi, registry);
      workers.push(elWorker);
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
