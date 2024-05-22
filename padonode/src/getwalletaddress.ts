import Arweave from "arweave";
import { exit } from "node:process";
import { readFileSync } from "node:fs";

async function main() {
  const args = process.argv.slice(2)
  if (args.length < 1) {
    console.log("args: <walletpath>");
    exit(2);
  }
  let walletpath = args[0];


  const wallet = JSON.parse(readFileSync(walletpath).toString());
  const address = await Arweave.init({}).wallets.jwkToAddress(wallet);
  console.log(`wallet address: ${address}.`);
}
main();
