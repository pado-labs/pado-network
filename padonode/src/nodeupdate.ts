import { createDataItemSigner } from "@permaweb/aoconnect";
import { readFileSync } from "node:fs";
import { exit } from "node:process";
import { updateNode } from "./index";


async function main() {
    const args = process.argv.slice(2)
    if (args.length < 2) {
        console.log("args: <walletpath> <name> [<desc>]");
        exit(2);
    }
    let walletpath = args[0];
    let name = args[1];
    let desc = `the description of ${name}`;
    if (args.length >= 3) {
        desc = args[2];
    }

    const wallet = JSON.parse(readFileSync(walletpath).toString());
    const signer = createDataItemSigner(wallet);

    try {
        const res = await updateNode(name, desc, signer);
        console.log(`updateNode res=${res}`);
    } catch (e) {
        console.log("updateNode exception:", e);
    }
}
main();
