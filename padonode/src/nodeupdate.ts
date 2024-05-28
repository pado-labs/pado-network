import {createDataItemSigner} from "@permaweb/aoconnect";
import {readFileSync} from "node:fs";
import {exit} from "node:process";
import {updateNode} from "./index";
import process from "node:process";


async function main() {
    let walletpath;
    let name;
    let desc;
    if (process.env.WALLET_PATH && process.env.NODE_NAME) {
        walletpath = process.env.WALLET_PATH;
        name = process.env.NODE_NAME;
        desc = `the description of ${name}`;
        if(process.env.NODE_DESC){
            desc = process.env.NODE_DESC;
        }
    } else {
        const args = process.argv.slice(2)
        if (args.length < 2) {
            console.log("args: <walletpath> <name> [<desc>]");
            exit(2);
        }
        walletpath = args[0];
        name = args[1];
        desc = `the description of ${name}`;
        if (args.length >= 3) {
            desc = args[2];
        }
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
