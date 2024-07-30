import { initAll, runWorker } from "./workers/worker";
import { newAOWorker } from "./workers/ao";

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
  const aoWorker = await newAOWorker(cfg, logger, nodeApi, registry);
  console.log('typeof aoWorker', typeof aoWorker);

  await runWorker([aoWorker]);
}

if (require.main === module) {
  main();
}
