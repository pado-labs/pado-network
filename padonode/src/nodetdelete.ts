import { createDataItemSigner } from "@permaweb/aoconnect";
import { readFileSync } from "node:fs";
import { exit } from "node:process";
import { deleteNode } from "./index";


async function main() {
    const args = process.argv.slice(2)
    if (args.length < 2) {
        console.log("args: <walletpath> <name>");
        exit(2);
    }
    let walletpath = args[0];
    let name = args[1];

    const wallet = JSON.parse(readFileSync(walletpath).toString());
    const signer = createDataItemSigner(wallet);

    try {
        const res = await deleteNode(name, signer);
        console.log(`deleteNode res=${res}`);
    } catch (e) {
        console.log("deleteNode exception:", e);
    }
}
main();
