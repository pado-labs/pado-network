use bfv::{BFVCiphertext, BFVPublicKey, BFVSecretKey, PlainField, ThresholdPKE};
use chacha20poly1305::Nonce;

use crate::comm::*;
use serde::{Deserialize, Serialize};
use std::ffi::CString;
use std::os::raw::c_char;

fn try_compress_sk(sk: &BFVSecretKey) -> String {
    let bytes = sk.to_vec();

    let iter = bytes
        .chunks_exact(4)
        .map(|chunk| <[u8; 4]>::try_from(chunk).unwrap());
    let mut b: u8 = 0;
    let mut bs: Vec<u8> = vec![];
    let mut index = 0;
    for v in iter {
        let k = (3 - index % 4) * 2;
        let u = u32::from_be_bytes(v);
        if u == 0 {
            b |= 0x00 << k;
        } else if u == 1 {
            b |= 0x01 << k;
        } else if u == 0x07e00000 {
            b |= 0x02 << k;
        } else {
            return hex::encode(bytes);
        }
        if index % 4 == 3 {
            bs.push(b);
            b = 0;
        }
        index += 1;
    }

    // println!("e bs.len() {}", bs.len());
    return hex::encode(bs);
}

fn try_decompress_sk(data: &String) -> BFVSecretKey {
    let bytes = hex::decode(data).unwrap();
    if bytes.len() != 256 {
        return BFVSecretKey::from_vec(&bytes);
    }

    let mut bs: Vec<u8> = vec![];
    for b in bytes {
        for i in 0..4 {
            let k = (3 - i) * 2;
            let mut u: u32 = 0;
            let v = (b >> k) & 0x03;
            if v == 0x00 {
                u = 0;
            } else if v == 0x01 {
                u = 1;
            } else if v == 0x02 {
                u = 0x07e00000;
            }
            bs.extend(u.to_be_bytes());
        }
    }
    // println!("d bs.len() {}", bs.len());
    return BFVSecretKey::from_vec(&bs);
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct KeyGenParam {
    t: usize,
    n: usize,                 // n >= 3; n >= t >= 1
    indices: Vec<PlainField>, // pado node index, start from 1
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct KeyGenResult {
    sk: BFVSecretKey, // secret key
    pk: BFVPublicKey, // public key
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct KeyGenResultS {
    sk: String, // secret key
    pk: String, // public key
}
impl KeyGenResult {
    pub fn to_json(&self) -> String {
        let sk = try_compress_sk(&self.sk);
        let pk = hex::encode(self.pk.to_vec());
        let ret = KeyGenResultS { sk, pk };
        let res = serde_json::to_string(&ret).unwrap();
        res
    }
}

pub fn _keygen(param: &KeyGenParam) -> KeyGenResult {
    let ctx = ThresholdPKE::gen_context(param.n, param.t, param.indices.clone());
    let (sk, pk) = ThresholdPKE::gen_keypair(&ctx);
    KeyGenResult { sk, pk }
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct EncryptParam {
    t: usize,
    n: usize,                    // n >= 3; n >= t >= 1
    indices: Vec<PlainField>,    // pado node index, start from 1
    node_pks: Vec<BFVPublicKey>, // pado node public keys, which length is equal to n
    msg_ptr: usize,              // the pointer to plain message
    msg_len: usize,              // the message size
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct EncryptParamS {
    t: usize,
    n: usize,                 // n >= 3; n >= t >= 1
    indices: Vec<PlainField>, // pado node index, start from 1
    node_pks: Vec<String>,    // pado node public keys, which length is equal to n
    msg_ptr: usize,           // the pointer to plain message
    msg_len: usize,           // the message size
}
impl EncryptParam {
    pub fn from_json(param: &str) -> EncryptParam {
        let param: EncryptParamS = serde_json::from_str(param).unwrap();
        let mut node_pks = vec![];
        for pk in param.node_pks.iter() {
            let _pk: BFVPublicKey = BFVPublicKey::from_vec(&hex::decode(pk).unwrap());
            node_pks.push(_pk);
        }

        EncryptParam {
            t: param.t,
            n: param.n,
            indices: param.indices,
            node_pks: node_pks,
            msg_ptr: param.msg_ptr,
            msg_len: param.msg_len,
        }
    }
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct EncryptResult {
    enc_sks: Vec<BFVCiphertext>, // encrypted secret keys, which length is equal to n
    nonce: Vec<u8>,              // nonce
    emsg_ptr: usize,             // the pointer to encrypted message
    emsg_len: usize,             // the message size
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct EncryptResultS {
    enc_sks: Vec<String>, // encrypted secret keys, which length is equal to n
    nonce: String,        // nonce
    emsg_ptr: usize,      // the pointer to encrypted message
    emsg_len: usize,      // the message size
}

impl EncryptResult {
    pub fn to_json(&self) -> String {
        let mut enc_sks = vec![];
        for enc_sk in self.enc_sks.iter() {
            let _enc_sk = hex::encode(enc_sk.to_vec());
            enc_sks.push(_enc_sk);
        }
        let nonce = hex::encode(&self.nonce);

        let ret = EncryptResultS {
            enc_sks,
            nonce,
            emsg_ptr: self.emsg_ptr,
            emsg_len: self.emsg_len,
        };
        let res = serde_json::to_string(&ret).unwrap();
        res
    }
}

pub fn _encrypt(param: &EncryptParam) -> EncryptResult {
    let ctx = ThresholdPKE::gen_context(param.n, param.t, param.indices.clone());

    let msg_ptr = param.msg_ptr as *mut u8;
    let msg_len = param.msg_len;
    let msg0 = std::ptr::slice_from_raw_parts_mut(msg_ptr, msg_len);
    let msg;
    unsafe {
        msg = &*msg0;
    }

    let (enc_sks, nonce, enc_msg) = ThresholdPKE::encrypt_bytes(&ctx, &param.node_pks, msg);

    let emsg_len = enc_msg.len();
    let emsg_ptr = enc_msg.as_ptr() as *const u8 as usize;
    std::mem::forget(enc_msg);

    EncryptResult {
        enc_sks,
        nonce: nonce.to_vec(),
        emsg_ptr: emsg_ptr,
        emsg_len: emsg_len,
    }
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct ReEncryptParam {
    t: usize,
    n: usize,                  // n >= 3; n >= t >= 1
    indices: Vec<PlainField>,  // pado node index, start from 1
    enc_sk: BFVCiphertext,     // data provider encrypted secrect key
    node_sk: BFVSecretKey,     // pado node secrect key
    consumer_pk: BFVPublicKey, // consumer publick key
}
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct ReEncryptParamS {
    t: usize,
    n: usize,                 // n >= 3; n >= t >= 1
    indices: Vec<PlainField>, // pado node index, start from 1
    enc_sk: String,           // data provider encrypted secrect key
    node_sk: String,          // pado node secrect key
    consumer_pk: String,      // consumer publick key
}

impl ReEncryptParam {
    pub fn from_json(param: &str) -> ReEncryptParam {
        let param: ReEncryptParamS = serde_json::from_str(param).unwrap();

        let enc_sk = BFVCiphertext::from_vec(&hex::decode(&param.enc_sk).unwrap());
        let node_sk = try_decompress_sk(&param.node_sk);
        let consumer_pk = BFVPublicKey::from_vec(&hex::decode(&param.consumer_pk).unwrap());
        ReEncryptParam {
            t: param.t,
            n: param.n,
            indices: param.indices,
            enc_sk: enc_sk,
            node_sk: node_sk,
            consumer_pk: consumer_pk,
        }
    }
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct ReEncryptResult {
    reenc_sk: BFVCiphertext, // re-encrypted secrect key
}
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct ReEncryptResultS {
    reenc_sk: String, // re-encrypted secrect key
}

impl ReEncryptResult {
    pub fn to_json(&self) -> String {
        let reenc_sk = hex::encode(self.reenc_sk.to_vec());
        let ret = ReEncryptResultS { reenc_sk };
        let res = serde_json::to_string(&ret).unwrap();
        res
    }
}

pub fn _reencrypt(param: &ReEncryptParam) -> ReEncryptResult {
    let ctx = ThresholdPKE::gen_context(param.n, param.t, param.indices.clone());

    let reenc_sk =
        ThresholdPKE::re_encrypt(&ctx, &param.enc_sk, &param.node_sk, &param.consumer_pk);
    ReEncryptResult { reenc_sk }
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct DecryptParam {
    t: usize,
    n: usize,                        // n >= 3; n >= t >= 1
    indices: Vec<PlainField>,        // pado node index, start from 1
    chosen_indices: Vec<PlainField>, // selected nodes for computing
    reenc_sks: Vec<BFVCiphertext>,   // re-encrypted secrect keys
    consumer_sk: BFVSecretKey,       // consumer secrect key
    nonce: Vec<u8>,                  // nonce
    emsg_ptr: usize,                 // the pointer to encrypted message
    emsg_len: usize,                 // the message size
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct DecryptParamS {
    t: usize,
    n: usize,                        // n >= 3; n >= t >= 1
    indices: Vec<PlainField>,        // pado node index, start from 1
    chosen_indices: Vec<PlainField>, // selected nodes for computing
    reenc_sks: Vec<String>,          // re-encrypted secrect keys
    consumer_sk: String,             // consumer secrect key
    nonce: String,                   // nonce
    emsg_ptr: usize,                 // the pointer to encrypted message
    emsg_len: usize,                 // the message size
}

impl DecryptParam {
    pub fn from_json(param: &str) -> DecryptParam {
        let param: DecryptParamS = serde_json::from_str(param).unwrap();

        let mut reenc_sks = vec![];
        for reenc_sk in param.reenc_sks.iter() {
            let _reenc_sk = BFVCiphertext::from_vec(&hex::decode(&reenc_sk).unwrap());
            reenc_sks.push(_reenc_sk);
        }

        let consumer_sk = try_decompress_sk(&param.consumer_sk);
        let nonce = hex::decode(&param.nonce).unwrap();
        DecryptParam {
            t: param.t,
            n: param.n,
            indices: param.indices,
            chosen_indices: param.chosen_indices,
            reenc_sks: reenc_sks,
            consumer_sk: consumer_sk,
            nonce: nonce,
            emsg_ptr: param.emsg_ptr,
            emsg_len: param.emsg_len,
        }
    }
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct DecryptResult {
    msg_ptr: usize, // the pointer to plain message
    msg_len: usize, // the message size
}

pub fn _decrypt(param: &DecryptParam) -> DecryptResult {
    let ctx = ThresholdPKE::gen_context(param.n, param.t, param.indices.clone());

    let emsg_ptr = param.emsg_ptr as *mut u8;
    let emsg_len = param.emsg_len;
    let emsg0 = std::ptr::slice_from_raw_parts_mut(emsg_ptr, emsg_len);
    let emsg;
    unsafe {
        emsg = &*emsg0;
    }

    let c = ThresholdPKE::combine(&ctx, &param.reenc_sks, &param.chosen_indices);

    let nonce = Nonce::clone_from_slice(&param.nonce);
    let msg = ThresholdPKE::decrypt_bytes(&ctx, &param.consumer_sk, &c, &nonce, emsg);

    let msg_len = msg.len();
    let msg_ptr = msg.as_ptr() as *const u8 as usize;
    std::mem::forget(msg);

    DecryptResult {
        msg_ptr: msg_ptr,
        msg_len: msg_len,
    }
}

///
///
///
#[no_mangle]
#[export_name = "keygen"]
pub extern "C" fn __keygen(c_param: *const c_char) -> *const c_char {
    let param = cstr2string(c_param);
    // println!("param1 {}", param);
    let param: KeyGenParam = serde_json::from_str(&param).unwrap();
    // println!("param2 {:?}", param);

    let ret = _keygen(&param);

    let res = ret.to_json();
    // println!("res:{} {}", res.len(), res);
    let s = CString::new(res).unwrap();
    s.into_raw()
}

///
///
///
#[no_mangle]
#[export_name = "encrypt"]
pub extern "C" fn __encrypt(c_param: *const c_char) -> *const c_char {
    let param = cstr2string(c_param);
    // println!("param1 {}", param);
    let param: EncryptParam = EncryptParam::from_json(&param);
    // println!("param2 {:?}", param);

    let ret = _encrypt(&param);

    let res = ret.to_json();
    // println!("res:{} {}", res.len(), res);
    let s = CString::new(res).unwrap();
    s.into_raw()
}

///
///
///
#[no_mangle]
#[export_name = "reencrypt"]
pub extern "C" fn __reencrypt(c_param: *const c_char) -> *const c_char {
    let param = cstr2string(c_param);
    // println!("param1 {}", param);
    let param: ReEncryptParam = ReEncryptParam::from_json(&param);
    // println!("param2 {:?}", param);

    let ret = _reencrypt(&param);

    let res = ret.to_json();
    // println!("res:{} {}", res.len(), res);
    let s = CString::new(res).unwrap();
    s.into_raw()
}

///
///
///
#[no_mangle]
#[export_name = "decrypt"]
pub extern "C" fn __decrypt(c_param: *const c_char) -> *const c_char {
    let param = cstr2string(c_param);
    // println!("param1 {}", param);
    let param: DecryptParam = DecryptParam::from_json(&param);
    // println!("param2 {:?}", param);

    let ret = _decrypt(&param);

    let res = serde_json::to_string(&ret).unwrap();
    // println!("res:{} {}", res.len(), res);
    let s = CString::new(res).unwrap();
    s.into_raw()
}
