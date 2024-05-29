import {createDataItemSigner} from "@permaweb/aoconnect";
import {readFileSync} from "node:fs";
import {exit} from "node:process";
import {registerNode} from "./index";
import * as process from "node:process";


async function main() {
    let keyfile;
    let walletpath;
    let name;
    let desc;
    if (process.env.KEY_FILE_PATH && process.env.WALLET_PATH && process.env.NODE_NAME) {
        keyfile = process.env.KEY_FILE_PATH;
        walletpath = process.env.WALLET_PATH;
        name = process.env.NODE_NAME;
        desc = `the description of ${name}`;
        if(process.env.NODE_DESC){
            desc = process.env.NODE_DESC;
        }
    } else {
        const args = process.argv.slice(2)
        if (args.length < 3) {
            console.log("args: <keyfile> <walletpath> <name> [<desc>]");
            exit(2);
        }
        keyfile = args[0];
        walletpath = args[1];
        name = args[2];
        desc = `the description of ${name}`;
        if (args.length >= 4) {
            desc = args[3];
        }
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
