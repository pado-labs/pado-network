import {exit} from "node:process";
import {writeFileSync} from "node:fs";
import {generateKey} from "./index";

async function main() {
    let keyfile
    if (process.env.KEY_FILE_PATH) {
        keyfile = process.env.KEY_FILE_PATH;
    } else {
        const args = process.argv.slice(2)
        if (args.length < 1) {
            console.log("args: <keyfile>");
            exit(2);
        }
        keyfile = args[0];
    }

    let key = await generateKey();
    writeFileSync(keyfile, JSON.stringify(key));
    console.log(`The key has been stored into ${keyfile}.`);
    console.log(`IMPORTANT! Don't lose this file and save it to a safe place!`);
}

main();
