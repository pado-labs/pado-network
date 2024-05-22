import { createDataItemSigner } from "@permaweb/aoconnect";
import { getPendingTasks, reportResult } from "pado-ao-sdk/processes/tasks";
import { getDataById } from "pado-ao-sdk/processes/dataregistry";
import { nodes } from "pado-ao-sdk/processes/noderegistry";
import { reencrypt } from "pado-ao-sdk/algorithm";
import { readFileSync } from "node:fs";
import { exit } from "node:process";

/**
 * 
 * Do task
 * 
 * 1. fetch pending task(s)
 * 2. do reencrypt
 * 3. submit result
 * 
 * @param name - the node name
 * @param sk - the node secert key
 */
async function doTask(name: string, sk: string, signer: any) {
    /// 1. fetch pending task(s)
    const pendingTasks = await getPendingTasks();
    let pendingTasksObj = Object();
    try {
        pendingTasksObj = JSON.parse(pendingTasks);
    } catch (e) {
        console.log("getPendingTasks JSON.parse(pendingTasks) exception:", e);
        return;
    }
    // console.log("doTask pendingTasks=", pendingTasks);
    for (var i in pendingTasksObj) {
        console.log("doTask DateTime:", new Date());

        var task = pendingTasksObj[i];
        // console.log("doTask task=", task);

        const taskId = task["id"];
        console.log("doTask taskId=", taskId);

        var inputData = task["inputData"]
        var inputDataObj = JSON.parse(inputData);
        // console.log("doTask inputData=", inputData);

        var dataId = inputDataObj["dataId"];
        console.log("doTask inputData.dataId=", dataId);


        const dataRes = await getDataById(dataId);
        let dataResObj = Object();
        let exData = Object();
        try {
            dataResObj = JSON.parse(dataRes);
            exData = JSON.parse(dataResObj.data);
        } catch (e) {
            console.log("getDataById JSON.parse(dataRes) exception:", e);
            return;
        }
        let policy = exData.policy;
        let indices = exData.policy.indices;
        let names = exData.policy.names;
        if (indices.length != names.length) {
            console.log(`indices.length(${indices.length}) != names.length(${names.length})`);
            return;
        }

        // console.log("doTask Data=", dataResObj);
        {
            var encSksObj = exData["encSks"];
            let encSk = "";
            for (var k = 0; k < names.length; k++) {
                if (names[k] == name) {
                    encSk = encSksObj[indices[k] - 1];
                    console.log(names[k], indices[k], name);
                    break;
                }
            }

            if (encSk == "") {
                console.log("can not found nodename:", name);
                return;
            }

            /// 2. do reencrypt
            var threshold = { t: policy.t, n: policy.n, indices: policy.indices };
            const enc_sk = encSk;
            const node_sk = sk;
            const consumer_pk = inputDataObj["consumerPk"];
            const reencsksObj = reencrypt(enc_sk, node_sk, consumer_pk, threshold);
            console.log("reencrypt res=", reencsksObj);
            var reencsks = JSON.stringify(reencsksObj);

            /// 3. submit result
            const res = await reportResult(taskId, name, reencsks, signer);
            console.log("reportResult res=", res);
        }
    }

}

async function getNodeName(pk: string): Promise<string> {
    let nodesObj = Object();
    try {
        let nodesres = await nodes();
        nodesObj = JSON.parse(nodesres);
    } catch (e) {
        console.error("getNodeName nodes() exception:", e);
        return "";
    }

    for (let i in nodesObj) {
        const node = nodesObj[i];
        if (node.publickey == pk) {
            return node.name;
        }
    }

    console.error("getNodeName cannot found node name by public key, please register node public key first.");
    return "";
}


async function do_task(name: string, sk: string, signer: any) {
    setTimeout(async () => {
        try {
            await doTask(name, sk, signer);
        } catch (e) {
            console.log("doTask exception:", e);
        }
        await do_task(name, sk, signer);
    }, 1000)
}


async function main() {
    const args = process.argv.slice(2)
    if (args.length < 2) {
        console.log("args: <keyfile> <walletpath>");
        exit(2);
    }
    let keyfile = args[0];
    let walletpath = args[1];

    const key = JSON.parse(readFileSync(keyfile).toString());
    const wallet = JSON.parse(readFileSync(walletpath).toString());
    const signer = createDataItemSigner(wallet);


    let name = await getNodeName(key.pk);
    if (name == "") {
        exit(1);
    }

    await do_task(name, key.sk, signer);
}
main();
