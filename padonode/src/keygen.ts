import { exit } from "node:process";
import { generateKey } from "pado-ao-sdk/index";
import { writeFileSync } from "node:fs";

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
    console.log(`IMPORTANT! Don't lose this file! Keep it safe!`);
}
main();
