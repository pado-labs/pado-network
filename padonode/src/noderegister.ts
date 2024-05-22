import { createDataItemSigner } from "@permaweb/aoconnect";
import { readFileSync } from "node:fs";
import { exit } from "node:process";
import { registerNode } from "./index";


async function main() {
    const args = process.argv.slice(2)
    if (args.length < 3) {
        console.log("args: <keyfile> <walletpath> <name> [<desc>]");
        exit(2);
    }
    let keyfile = args[0];
    let walletpath = args[1];
    let name = args[2];
    let desc = `the description of ${name}`;
    if (args.length >= 4) {
        desc = args[3];
    }

    const key = JSON.parse(readFileSync(keyfile).toString());
    const wallet = JSON.parse(readFileSync(walletpath).toString());
    const signer = createDataItemSigner(wallet);

    try {
        const res = await registerNode(name, key.pk, desc, signer);
        console.log(`registerNode res=${res}`);
    } catch (e) {
        console.log("registerNode exception:", e);
    }
}
main();
