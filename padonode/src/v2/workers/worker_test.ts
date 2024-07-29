import { initAll } from "./worker";
import { newNativeWorker } from "./native";
import { newEigenLayerWorker } from "./eigenlayer";
import { newAOWorker } from "./ao";

import * as dotenv from "dotenv";
dotenv.config();

async function test() {
  const [cfg, logger, nodeApi, registry, metrics] = initAll();

  const nativeWorker = await newNativeWorker(cfg, logger, nodeApi, registry);
  console.log('typeof nativeWorker', typeof nativeWorker);

  const eigenWorker = await newEigenLayerWorker(cfg, logger, nodeApi, registry);
  console.log('typeof eigenWorker', typeof eigenWorker);

  const aoWorker = await newAOWorker(cfg, logger, nodeApi, registry);
  console.log('typeof aoWorker', typeof aoWorker);


  nodeApi.start();
  metrics.start();
  // nativeWorker.doTask();
  // eigenWorker.doTask();
  // aoWorker.doTask();
}

if (require.main === module) {
  test();
}

