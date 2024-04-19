use bfv::{BFVCiphertext, BFVPublicKey, BFVSecretKey, PlainField, ThresholdPKE};
use chacha20poly1305::Nonce;

use crate::comm::*;
use serde::{Deserialize, Serialize};
use std::ffi::CString;
use std::os::raw::c_char;

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
        let sk = hex::encode(self.sk.to_vec());
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
    msg: Vec<u8>,                // plain message
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct EncryptParamS {
    t: usize,
    n: usize,                 // n >= 3; n >= t >= 1
    indices: Vec<PlainField>, // pado node index, start from 1
    node_pks: Vec<String>,    // pado node public keys, which length is equal to n
    msg: Vec<u8>,             // plain message
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
            msg: param.msg,
        }
    }
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct EncryptResult {
    enc_sks: Vec<BFVCiphertext>, // encrypted secret keys, which length is equal to n
    nonce: Vec<u8>,              // nonce
    enc_msg: Vec<u8>,            // encrypted message
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct EncryptResultS {
    enc_sks: Vec<String>, // encrypted secret keys, which length is equal to n
    nonce: String,        // nonce
    enc_msg: String,      // encrypted message
}

impl EncryptResult {
    pub fn to_json(&self) -> String {
        let mut enc_sks = vec![];
        for enc_sk in self.enc_sks.iter() {
            let _enc_sk = hex::encode(enc_sk.to_vec());
            enc_sks.push(_enc_sk);
        }
        let nonce = hex::encode(&self.nonce);
        let enc_msg = hex::encode(&self.enc_msg);

        let ret = EncryptResultS {
            enc_sks,
            nonce,
            enc_msg,
        };
        let res = serde_json::to_string(&ret).unwrap();
        res
    }
}

pub fn _encrypt(param: &EncryptParam) -> EncryptResult {
    let ctx = ThresholdPKE::gen_context(param.n, param.t, param.indices.clone());

    let (enc_sks, nonce, enc_msg) = ThresholdPKE::encrypt_bytes(&ctx, &param.node_pks, &param.msg);

    EncryptResult {
        enc_sks,
        nonce: nonce.to_vec(),
        enc_msg,
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
        let node_sk = BFVSecretKey::from_vec(&hex::decode(&param.node_sk).unwrap());
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
    enc_msg: Vec<u8>,                // encrypted message
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
    enc_msg: String,                 // encrypted message
}

impl DecryptParam {
    pub fn from_json(param: &str) -> DecryptParam {
        let param: DecryptParamS = serde_json::from_str(param).unwrap();

        let mut reenc_sks = vec![];
        for reenc_sk in param.reenc_sks.iter() {
            let _reenc_sk = BFVCiphertext::from_vec(&hex::decode(&reenc_sk).unwrap());
            reenc_sks.push(_reenc_sk);
        }

        let consumer_sk = BFVSecretKey::from_vec(&hex::decode(&param.consumer_sk).unwrap());
        let nonce = hex::decode(&param.nonce).unwrap();
        let enc_msg = hex::decode(&param.enc_msg).unwrap();
        DecryptParam {
            t: param.t,
            n: param.n,
            indices: param.indices,
            chosen_indices: param.chosen_indices,
            reenc_sks: reenc_sks,
            consumer_sk: consumer_sk,
            nonce: nonce,
            enc_msg: enc_msg,
        }
    }
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct DecryptResult {
    msg: Vec<u8>, // decrypted message
}

pub fn _decrypt(param: &DecryptParam) -> DecryptResult {
    let ctx = ThresholdPKE::gen_context(param.n, param.t, param.indices.clone());

    let c = ThresholdPKE::combine(&ctx, &param.reenc_sks, &param.chosen_indices);

    let nonce = Nonce::clone_from_slice(&param.nonce);
    let msg = ThresholdPKE::decrypt_bytes(&ctx, &param.consumer_sk, &c, &nonce, &param.enc_msg);
    DecryptResult { msg }
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
