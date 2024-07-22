import { Command } from "commander";
import { registerAsOperator, registerOperatorInQuorumWithAVSRegistryCoordinator, getOperatorId } from "./register";
const program = new Command();

async function register_as_operator(options: any) {
  console.log('options', options);

  await registerAsOperator();
}

async function register(options: any) {
  console.log('options', options);

  const quorumNumbers: Uint8Array = options.quorumIdList.split(',').map((i: number) => { return Number(i) });
  await registerOperatorInQuorumWithAVSRegistryCoordinator(quorumNumbers);
}

async function get_operator_id(options: any) {
  console.log('options', options);

  await getOperatorId(options.operator);
}

async function main() {
  program.command('register-as-operator')
    .description('Register as Operator on EigenLayer')
    .requiredOption('--chain <NAME>', 'blockchain(unsupported now)', 'holesky')
    .action((options) => { register_as_operator(options); });

  program.command('register')
    .description('Register to AVS.')
    .requiredOption('--chain <NAME>', 'blockchain(unsupported now)', 'holesky')
    .requiredOption('--quorum-id-list <ID>', 'quorum number, split by comma. e.g.: 0/1/0,1')
    .action((options) => { register(options); });

  program.command('get-operator-id')
    .description('Get the Operator Id.')
    .option('--operator <ADDRESS>', 'the operator address')
    .action((options) => { get_operator_id(options); });

  await program.parseAsync(process.argv);
}
main()

