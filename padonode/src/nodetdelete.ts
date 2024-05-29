import {createDataItemSigner} from "@permaweb/aoconnect";
import {readFileSync} from "node:fs";
import {exit} from "node:process";
import {deleteNode} from "./index";


async function main() {
    let walletpath;
    let name;
    if (process.env.NODE_NAME && process.env.WALLET_PATH) {
        walletpath = process.env.WALLET_PATH;
        name = process.env.NODE_NAME;
    } else {
        const args = process.argv.slice(2)
        if (args.length < 2) {
            console.log("args: <walletpath> <name>");
            exit(2);
        }
        walletpath = args[0];
        name = args[1];
    }

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
