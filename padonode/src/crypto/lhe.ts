// @ts-nocheck
var lhe: any = undefined;
if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    import("./lib/lhe").then((lhei) => {
        lhe = lhei;
    })
} else {
    lhe = window.Module;
}

export const THRESHOLD_2_3 = { t: 2, n: 3, indices: [1, 2, 3] };

const lhe_call = (func: any, param_obj: any) => {
    let param_json = JSON.stringify(param_obj);
    let param_ptr = lhe.allocateUTF8(param_json);

    let cptr = func(param_ptr);
    lhe._free(param_ptr);

    let ret_json = lhe.UTF8ToString(cptr);
    lhe._free_cptr(cptr);

    let ret_obj = JSON.parse(ret_json);

    return ret_obj;
}

export const keygen = (param_obj: any = THRESHOLD_2_3) => {
    return lhe_call(lhe._keygen, param_obj);
}

export const encrypt = (publicKeys: string[], data: Uint8Array, threshold: any = THRESHOLD_2_3) => {
    let msg_len = data.length;
    let msg_ptr = lhe._malloc(msg_len);
    let msg_buffer = new Uint8Array(lhe.wasmMemory.buffer, msg_ptr, msg_len);
    msg_buffer.set(data);

    let param_obj = { ...threshold, node_pks: publicKeys, msg_len: msg_len, msg_ptr: msg_ptr };

    let res = lhe_call(lhe._encrypt, param_obj);
    lhe._free(msg_ptr)

    let dataview = new Uint8Array(lhe.wasmMemory.buffer, res.emsg_ptr, res.emsg_len);
    res.enc_msg = new Uint8Array(dataview);
    lhe._free(res.emsg_ptr)

    return res;
}

export const reencrypt = (
    enc_sk: string,
    node_sk: string,
    consumer_pk: string,
    threshold: any = THRESHOLD_2_3) => {
    let param_obj = { ...threshold, enc_sk: enc_sk, node_sk: node_sk, consumer_pk: consumer_pk };
    return lhe_call(lhe._reencrypt, param_obj);
}

export const decrypt = (reenc_sks: string[],
    consumer_sk: string,
    nonce: string,
    enc_msg: Uint8Array,
    chosen_indices: any = [1, 2],
    threshold: any = THRESHOLD_2_3) => {

    let emsg_len = enc_msg.length;
    let emsg_ptr = lhe._malloc(emsg_len);
    let emsg_buffer = new Uint8Array(lhe.wasmMemory.buffer, emsg_ptr, emsg_len);
    emsg_buffer.set(enc_msg)

    let param_obj = {
        ...threshold, reenc_sks: reenc_sks, consumer_sk: consumer_sk,
        nonce: nonce, emsg_ptr: emsg_ptr, emsg_len: emsg_len, chosen_indices: chosen_indices
    };

    let res = lhe_call(lhe._decrypt, param_obj);
    lhe._free(emsg_ptr)

    let dataview = new Uint8Array(lhe.wasmMemory.buffer, res.msg_ptr, res.msg_len);
    res.msg = new Uint8Array(dataview);
    lhe._free(res.msg_ptr)

    return res;
}


export interface Policy {
    t: number, // threshold
    n: number, // total_number
};

/**
 * 
 * @returns `{sk, pk}`
 */
export const keygen_v2 = () => {
    return lhe_call(lhe._keygen_v2, {});
}

/**
 * 
 * @param publicKeys Sequence of public keys, which size is equal to policy.n
 * @param data Data to be encrypted
 * @param policy Policy{t(threshold), n(total_number)}
 * @returns The encrypted data(enc_msg) and encrypted secret keys(enc_sks)
 */
export const encrypt_v2 = (publicKeys: string[], data: Uint8Array, policy: Policy) => {
    let msg_len = data.length;
    let msg_ptr = lhe._malloc(msg_len);
    let msg_buffer = new Uint8Array(lhe.wasmMemory.buffer, msg_ptr, msg_len);
    msg_buffer.set(data);

    let param_obj = { ...policy, node_pks: publicKeys, msg_len: msg_len, msg_ptr: msg_ptr };

    let res = lhe_call(lhe._encrypt_v2, param_obj);
    lhe._free(msg_ptr)

    let dataview = new Uint8Array(lhe.wasmMemory.buffer, res.emsg_ptr, res.emsg_len);
    let enc_msg = new Uint8Array(dataview);
    lhe._free(res.emsg_ptr);

    let enc_sks_dataview = new Uint8Array(lhe.wasmMemory.buffer, res.enc_sks_ptr, res.enc_sks_len);
    let enc_sks = new Uint8Array(enc_sks_dataview);
    lhe._free(res.enc_sks_ptr);

    return { enc_msg, enc_sks };
}

/**
 * 
 * @param enc_sk_index The index of enc_sk start from 1
 * @param node_sk 
 * @param consumer_pk 
 * @param enc_sks Returned by encrypt_v2
 * @returns The re-encrypt encrypted secret key(reenc_sk)
 */
export const reencrypt_v2 = (
    enc_sk_index: number,
    node_sk: string,
    consumer_pk: string,
    enc_sks: Uint8Array,
) => {
    let enc_sks_len = enc_sks.length;
    let enc_sks_ptr = lhe._malloc(enc_sks_len);
    let enc_sks_buffer = new Uint8Array(lhe.wasmMemory.buffer, enc_sks_ptr, enc_sks_len);
    enc_sks_buffer.set(enc_sks)

    let param_obj = {
        enc_sk_index: enc_sk_index,
        node_sk: node_sk,
        consumer_pk: consumer_pk,
        enc_sks_ptr: enc_sks_ptr,
        enc_sks_len: enc_sks_len
    };

    let res = lhe_call(lhe._reencrypt_v2, param_obj);
    lhe._free(enc_sks_ptr)

    let dataview = new Uint8Array(lhe.wasmMemory.buffer, res.reenc_ptr, res.reenc_len);
    let reenc_sk = new Uint8Array(dataview);
    lhe._free(res.reenc_ptr)

    return { reenc_sk };
}


/**
 * 
 * @param reenc_sks 
 * @param consumer_sk 
 * @param enc_msg Returned by encrypt_v2
 * @param chosen_indices 
 * @returns The decrypted data (msg)
 */
export const decrypt_v2 = (reenc_sks: string[],
    consumer_sk: string,
    enc_msg: Uint8Array,
    chosen_indices: number[]) => {

    let emsg_len = enc_msg.length;
    let emsg_ptr = lhe._malloc(emsg_len);
    let emsg_buffer = new Uint8Array(lhe.wasmMemory.buffer, emsg_ptr, emsg_len);
    emsg_buffer.set(enc_msg)

    let param_obj = {
        chosen_indices: chosen_indices,
        reenc_sks: reenc_sks,
        consumer_sk: consumer_sk,
        emsg_ptr: emsg_ptr,
        emsg_len: emsg_len
    };

    let res = lhe_call(lhe._decrypt_v2, param_obj);
    lhe._free(emsg_ptr)

    let dataview = new Uint8Array(lhe.wasmMemory.buffer, res.msg_ptr, res.msg_len);
    let msg = new Uint8Array(dataview);
    lhe._free(res.msg_ptr)

    return { msg };
}


export type LHEKey = {
    pk: string;
    sk: string;
};

/**
 * Generate private and public key pair
 *
 * @returns Return the key pair object which contains pk and sk fields
 */
export function generateKey(): Promise<LHEKey> {
    if (lhe && lhe._keygen) {
        return keygen_v2();
    }

    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(keygen_v2());
        }, 1000);
    });
};


async function test() {
    const r = await generateKey();
    console.log(r);
}
if (require.main === module) {
    test();
}
