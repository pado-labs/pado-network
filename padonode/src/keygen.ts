import { exit } from "node:process";
import { writeFileSync } from "node:fs";
import { generateKey } from "./index";

async function main() {
    const args = process.argv.slice(2)
    if (args.length < 1) {
        console.log("args: <keyfile>");
        exit(2);
    }
    let keyfile = args[0];

    let key = await generateKey();
    writeFileSync(keyfile, JSON.stringify(key));
    console.log(`The key has been stored into ${keyfile}.`);
    console.log(`IMPORTANT! Don't lose this file and save it to a safe place!`);
}
main();
