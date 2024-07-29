import { program } from "commander";

program
  .requiredOption('--chain <NAME>', 'blockchain', 'holesky');

program.parse();
const options = program.opts();
console.log('options', options);


async function main() {
}
if (require.main === module) {
  main();
}