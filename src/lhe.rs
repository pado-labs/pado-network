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

pub fn _keygen(param: &KeyGenParam) -> KeyGenResult {
    let ctx = ThresholdPKE::gen_context(param.n, param.t, param.indices.clone());
    let (sk, pk) = ThresholdPKE::gen_keypair(&ctx);
    KeyGenResult { sk, pk }
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct EncryptParam {
    t: usize,
    n: usize,                 // n >= 3; n >= t >= 1
    indices: Vec<PlainField>, // pado node index, start from 1
    pks: Vec<BFVPublicKey>,   // pado node public keys, which length is equal to n
    msg: Vec<u8>,             // plain message
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct EncryptResult {
    enc_sks: Vec<BFVCiphertext>, // encrypted secret keys, which length is equal to n
    nonce: Vec<u8>,              // nonce
    enc_msg: Vec<u8>,            // encrypted message
}

pub fn _encrypt(param: &EncryptParam) -> EncryptResult {
    let ctx = ThresholdPKE::gen_context(param.n, param.t, param.indices.clone());

    let (enc_sks, nonce, enc_msg) = ThresholdPKE::encrypt_bytes(&ctx, &param.pks, &param.msg);

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
pub struct ReEncryptResult {
    re_enc_sk: BFVCiphertext, // re-encrypted secrect key
}

pub fn _reencrypt(param: &ReEncryptParam) -> ReEncryptResult {
    let ctx = ThresholdPKE::gen_context(param.n, param.t, param.indices.clone());

    let re_enc_sk =
        ThresholdPKE::re_encrypt(&ctx, &param.enc_sk, &param.node_sk, &param.consumer_pk);
    ReEncryptResult { re_enc_sk }
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct DecryptParam {
    t: usize,
    n: usize,                        // n >= 3; n >= t >= 1
    indices: Vec<PlainField>,        // pado node index, start from 1
    re_enc_sks: Vec<BFVCiphertext>,  // re-encrypted secrect keys
    chosen_indices: Vec<PlainField>, // selected nodes for computing
    consumer_sk: BFVSecretKey,       // consumer secrect key
    nonce: Vec<u8>,                  // nonce
    enc_msg: Vec<u8>,                // encrypted message
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct DecryptResult {
    msg: Vec<u8>, // decrypted message
}

pub fn _decrypt(param: &DecryptParam) -> DecryptResult {
    let ctx = ThresholdPKE::gen_context(param.n, param.t, param.indices.clone());

    let c = ThresholdPKE::combine(&ctx, &param.re_enc_sks, &param.chosen_indices);

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
    println!("param1 {}", param);
    let param: KeyGenParam = serde_json::from_str(&param).unwrap();
    println!("param2 {:?}", param);

    let ret = _keygen(&param);

    let res = serde_json::to_string(&ret).unwrap();
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
    println!("param1 {}", param);
    let param: EncryptParam = serde_json::from_str(&param).unwrap();
    println!("param2 {:?}", param);

    let ret = _encrypt(&param);

    let res = serde_json::to_string(&ret).unwrap();
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
    println!("param1 {}", param);
    let param: ReEncryptParam = serde_json::from_str(&param).unwrap();
    println!("param2 {:?}", param);

    let ret = _reencrypt(&param);

    let res = serde_json::to_string(&ret).unwrap();
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
    println!("param1 {}", param);
    let param: DecryptParam = serde_json::from_str(&param).unwrap();
    println!("param2 {:?}", param);

    let ret = _decrypt(&param);

    let res = serde_json::to_string(&ret).unwrap();
    // println!("res:{} {}", res.len(), res);
    let s = CString::new(res).unwrap();
    s.into_raw()
}
