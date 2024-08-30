use algebra::Field;
use bfv::{BFVCiphertext, BFVPublicKey, BFVSecretKey, PlainField, ThresholdPKE};
use chacha20poly1305::Nonce;

use crate::comm::*;
use serde::{Deserialize, Serialize};
use std::ffi::CString;
use std::os::raw::c_char;
use std::vec;

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

pub fn _keygen_v2() -> KeyGenResult {
    // fake t,n,indices
    let total_number = 3;
    let threshold_number = 2;
    let mut indices: Vec<PlainField> = Vec::new();
    for i in 1..total_number + 1 {
        indices.push(PlainField::new(i as u16));
    }

    let ctx = ThresholdPKE::gen_context(total_number, threshold_number, indices);
    let (sk, pk) = ThresholdPKE::gen_keypair(&ctx);
    KeyGenResult { sk, pk }
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct EncryptParam {
    t: usize,
    n: usize,                    // n >= 3; n >= t >= 1
    node_pks: Vec<BFVPublicKey>, // pado node public keys, which length is equal to n
    msg_ptr: usize,              // the pointer to plain message
    msg_len: usize,              // the message size
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct EncryptParamS {
    t: usize,
    n: usize,              // n >= 3; n >= t >= 1
    node_pks: Vec<String>, // pado node public keys, which length is equal to n
    msg_ptr: usize,        // the pointer to plain message
    msg_len: usize,        // the message size
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
            node_pks: node_pks,
            msg_ptr: param.msg_ptr,
            msg_len: param.msg_len,
        }
    }
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct EncryptResult {
    enc_sks_ptr: usize, // the pointer to [policy, enc_sks(encrypted secret keys)]
    enc_sks_len: usize, // size of the data pointed to by the emsg_ptr
    emsg_ptr: usize,    // the pointer to [policy, nonce, encrypted message]
    emsg_len: usize,    // size of the data pointed to by the emsg_ptr
}

pub fn _encrypt_v2(param: &EncryptParam) -> EncryptResult {
    let t = param.t;
    let n = param.n;
    let mut indices: Vec<PlainField> = Vec::new();
    for i in 1..n + 1 {
        indices.push(PlainField::new(i as u16));
    }
    let ctx = ThresholdPKE::gen_context(n, t, indices);

    let msg_ptr = param.msg_ptr as *mut u8;
    let msg_len = param.msg_len;
    let msg0 = std::ptr::slice_from_raw_parts_mut(msg_ptr, msg_len);
    let msg;
    unsafe {
        msg = &*msg0;
    }

    let (enc_sks, nonce, enc_msg) = ThresholdPKE::encrypt_bytes(&ctx, &param.node_pks, msg);

    // serialize ==============================================
    let mut enc_data: Vec<u8> = vec![];

    // policy(t,n)
    let t = param.t as u32;
    enc_data.extend(t.to_be_bytes());
    let n = param.n as u32;
    enc_data.extend(n.to_be_bytes());

    // enc_sks
    let mut enc_sks_data = enc_data.clone();
    let enc_sks_size = enc_sks.len() as u32;
    enc_sks_data.extend(enc_sks_size.to_be_bytes());
    for enc_sk in enc_sks.iter() {
        let _enc_sk = enc_sk.to_vec();
        let _enc_sk_size = _enc_sk.len() as u32;
        enc_sks_data.extend(_enc_sk_size.to_be_bytes());
        enc_sks_data.extend(_enc_sk);
    }

    // nonce
    let nonce_vec = nonce.to_vec();
    let nonce_vec_size = nonce_vec.len() as u32;
    enc_data.extend(nonce_vec_size.to_be_bytes());
    enc_data.extend(nonce_vec);

    // enc_msg
    let enc_msg_size = enc_msg.len() as u32;
    enc_data.extend(enc_msg_size.to_be_bytes());
    enc_data.extend(enc_msg);
    // serialize ==============================================

    let enc_sks_len = enc_sks_data.len();
    let enc_sks_ptr = enc_sks_data.as_ptr() as *const u8 as usize;
    std::mem::forget(enc_sks_data);

    let emsg_len = enc_data.len();
    let emsg_ptr = enc_data.as_ptr() as *const u8 as usize;
    std::mem::forget(enc_data);

    EncryptResult {
        enc_sks_ptr: enc_sks_ptr,
        enc_sks_len: enc_sks_len,
        emsg_ptr: emsg_ptr,
        emsg_len: emsg_len,
    }
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct ReEncryptParam {
    enc_sk_index: usize,       // the index of enc_sks (from 1)
    node_sk: BFVSecretKey,     // pado node secrect key
    consumer_pk: BFVPublicKey, // consumer publick key
    enc_sks_ptr: usize,        // the pointer to encrypted message
    enc_sks_len: usize,        // the message size
}
#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct ReEncryptParamS {
    enc_sk_index: usize, // the index of enc_sks (from 1)
    node_sk: String,     // pado node secrect key
    consumer_pk: String, // consumer publick key
    enc_sks_ptr: usize,  // the pointer to encrypted message
    enc_sks_len: usize,  // the message size
}

impl ReEncryptParam {
    pub fn from_json(param: &str) -> ReEncryptParam {
        let param: ReEncryptParamS = serde_json::from_str(param).unwrap();

        let node_sk = try_decompress_sk(&param.node_sk);
        let consumer_pk = BFVPublicKey::from_vec(&hex::decode(&param.consumer_pk).unwrap());
        ReEncryptParam {
            enc_sk_index: param.enc_sk_index,
            node_sk: node_sk,
            consumer_pk: consumer_pk,
            enc_sks_ptr: param.enc_sks_ptr,
            enc_sks_len: param.enc_sks_len,
        }
    }
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct ReEncryptResult {
    reenc_ptr: usize, // the pointer to [reenc_sk(re-encrypted secrect key)]
    reenc_len: usize, // size of the data pointed to by the reenc_ptr
}

pub fn _reencrypt_v2(param: &ReEncryptParam) -> ReEncryptResult {
    let enc_sks_ptr = param.enc_sks_ptr as *mut u8;
    let enc_sks_len = param.enc_sks_len;
    let emsg0 = std::ptr::slice_from_raw_parts_mut(enc_sks_ptr, enc_sks_len);
    let ref_data;
    unsafe {
        ref_data = &*emsg0;
    }

    // deserialize ==============================================
    let mut pos = 0;
    // policy(t,n)
    let t: &[u8; 4] = &ref_data[pos..pos + 4].try_into().unwrap();
    let t = u32::from_be_bytes(t.clone()) as usize;
    pos += 4;
    // println!("t {:?}", t);

    let n: &[u8; 4] = &ref_data[pos..pos + 4].try_into().unwrap();
    let n = u32::from_be_bytes(n.clone()) as usize;
    pos += 4;
    // println!("n {:?}", n);

    // enc_sks
    let mut enc_sk_beg = 0;
    let mut enc_sk_end = 0;
    let enc_sks_size: &[u8; 4] = &ref_data[pos..pos + 4].try_into().unwrap();
    let enc_sks_size = u32::from_be_bytes(enc_sks_size.clone()) as usize;
    pos += 4;
    // println!("enc_sks_size {:?}", enc_sks_size);
    for i in 0..enc_sks_size {
        let enc_sk_len: &[u8; 4] = &ref_data[pos..pos + 4].try_into().unwrap();
        let enc_sk_len = u32::from_be_bytes(enc_sk_len.clone()) as usize;
        pos += 4;
        // println!("enc_sk_len {:?}", enc_sk_len);
        if i + 1 == param.enc_sk_index {
            enc_sk_beg = pos;
            enc_sk_end = enc_sk_len + pos;
        }
        pos += enc_sk_len;
    }
    assert!(
        enc_sk_beg > 0 && enc_sk_end > enc_sk_beg,
        "not s.t.: enc_sk_beg>0 && enc_sk_end>enc_sk_beg"
    );
    let enc_sk = &ref_data[enc_sk_beg..enc_sk_end];
    // println!("enc_sk {:?}", enc_sk);

    // println!(
    //     "ref_data.len {} enc_msg.len {} pos {:?}",
    //     ref_data.len(),
    //     enc_msg.len(),
    //     pos
    // );
    // deserialize ==============================================

    let mut indices: Vec<PlainField> = Vec::new();
    for i in 1..n + 1 {
        indices.push(PlainField::new(i as u16));
    }

    let ctx = ThresholdPKE::gen_context(n, t, indices);

    let enc_sk = BFVCiphertext::from_vec(enc_sk);
    let reenc_sk = ThresholdPKE::re_encrypt(&ctx, &enc_sk, &param.node_sk, &param.consumer_pk);

    // serialize
    let mut enc_data: Vec<u8> = vec![];

    // reenc_sk
    let _reenc_sk = reenc_sk.to_vec();
    let _reenc_sk_size = _reenc_sk.len() as u32;
    enc_data.extend(_reenc_sk_size.to_be_bytes());
    enc_data.extend(_reenc_sk);

    // more ...

    let reenc_len = enc_data.len();
    let reenc_ptr = enc_data.as_ptr() as *const u8 as usize;
    std::mem::forget(enc_data);

    ReEncryptResult {
        reenc_ptr: reenc_ptr,
        reenc_len: reenc_len,
    }
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct DecryptParam {
    chosen_indices: Vec<PlainField>, // selected nodes for computing
    reenc_sks: Vec<BFVCiphertext>,   // re-encrypted secrect keys
    consumer_sk: BFVSecretKey,       // consumer secrect key
    emsg_ptr: usize,                 // the pointer to encrypted message
    emsg_len: usize,                 // the message size
}

#[derive(Clone, Debug, PartialEq, Serialize, Deserialize)]
pub struct DecryptParamS {
    chosen_indices: Vec<PlainField>, // selected nodes for computing
    reenc_sks: Vec<String>,          // re-encrypted secrect keys (hex-string)
    consumer_sk: String,             // consumer secrect key
    emsg_ptr: usize,                 // the pointer to encrypted message
    emsg_len: usize,                 // the message size
}

impl DecryptParam {
    pub fn from_json(param: &str) -> DecryptParam {
        let param: DecryptParamS = serde_json::from_str(param).unwrap();

        let mut reenc_sks = vec![];
        for reenc_sk in param.reenc_sks.iter() {
            let _reenc_sk: Vec<u8> = hex::decode(&reenc_sk).unwrap();
            let ref_data: &[u8] = _reenc_sk.as_ref();
            let mut pos = 0;
            let data_len: &[u8; 4] = &ref_data[pos..pos + 4].try_into().unwrap();
            let data_len = u32::from_be_bytes(data_len.clone()) as usize;
            // println!("data_len {:?}", data_len);
            pos += 4;
            let data = &ref_data[pos..data_len + pos];
            // println!("data {:?}", data);
            pos += data_len;
            // println!(
            //     "_reenc_sk.len {} data.len {} pos {:?}",
            //     _reenc_sk.len(),
            //     data.len(),
            //     pos
            // );
            let _ = pos;

            let _reenc_sk = BFVCiphertext::from_vec(data);
            reenc_sks.push(_reenc_sk);
        }

        let consumer_sk = try_decompress_sk(&param.consumer_sk);
        DecryptParam {
            chosen_indices: param.chosen_indices,
            reenc_sks: reenc_sks,
            consumer_sk: consumer_sk,
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

pub fn _decrypt_v2(param: &DecryptParam) -> DecryptResult {
    let emsg_ptr = param.emsg_ptr as *mut u8;
    let emsg_len = param.emsg_len;
    let emsg0 = std::ptr::slice_from_raw_parts_mut(emsg_ptr, emsg_len);
    let ref_data;
    unsafe {
        ref_data = &*emsg0;
    }

    // deserialize ==============================================
    let mut pos = 0;
    // policy(t,n)
    let t: &[u8; 4] = &ref_data[pos..pos + 4].try_into().unwrap();
    let t = u32::from_be_bytes(t.clone()) as usize;
    pos += 4;
    // println!("t {:?}", t);

    let n: &[u8; 4] = &ref_data[pos..pos + 4].try_into().unwrap();
    let n = u32::from_be_bytes(n.clone()) as usize;
    pos += 4;
    // println!("n {:?}", n);

    // nonce
    let nonce_len: &[u8; 4] = &ref_data[pos..pos + 4].try_into().unwrap();
    let nonce_len = u32::from_be_bytes(nonce_len.clone()) as usize;
    // println!("nonce_len {:?}", nonce_len);
    pos += 4;
    let nonce = &ref_data[pos..nonce_len + pos];
    // println!("nonce {:?}", nonce);
    pos += nonce_len;

    // enc_msg
    let enc_msg_len: &[u8; 4] = &ref_data[pos..pos + 4].try_into().unwrap();
    let enc_msg_len = u32::from_be_bytes(enc_msg_len.clone()) as usize;
    // println!("enc_msg_len {:?}", enc_msg_len);
    pos += 4;
    let enc_msg = &ref_data[pos..enc_msg_len + pos];
    // println!("enc_msg {:?}", enc_msg);
    pos += enc_msg_len;

    assert!(pos == emsg_len, "in decrypt pos != emsg_len");

    // println!(
    //     "ref_data.len {} enc_msg.len {} pos {:?}",
    //     ref_data.len(),
    //     enc_msg.len(),
    //     pos
    // );
    // deserialize ==============================================
    // println!("ddd enc_msg {:?}", enc_msg);

    let mut indices: Vec<PlainField> = Vec::new();
    for i in 1..n + 1 {
        indices.push(PlainField::new(i as u16));
    }
    // println!("x indices {:?}", indices);
    let ctx = ThresholdPKE::gen_context(n, t, indices);

    let c = ThresholdPKE::combine(&ctx, &param.reenc_sks, &param.chosen_indices);

    let nonce = Nonce::clone_from_slice(&nonce);
    // println!("xxx nonce {:?}", nonce);
    let msg = ThresholdPKE::decrypt_bytes(&ctx, &param.consumer_sk, &c, &nonce, enc_msg);
    // println!("x msg {:?}", msg);

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
#[export_name = "keygen_v2"]
pub extern "C" fn __keygen_v2(c_param: *const c_char) -> *const c_char {
    let _param = cstr2string(c_param);
    // println!("param1 {}", param);

    let ret = _keygen_v2();

    let res = ret.to_json();
    // println!("res:{} {}", res.len(), res);
    let s = CString::new(res).unwrap();
    s.into_raw()
}

///
///
///
#[no_mangle]
#[export_name = "encrypt_v2"]
pub extern "C" fn __encrypt_v2(c_param: *const c_char) -> *const c_char {
    let param = cstr2string(c_param);
    // println!("param1 {}", param);
    let param: EncryptParam = EncryptParam::from_json(&param);
    // println!("param2 {:?}", param);

    let ret = _encrypt_v2(&param);

    let res = serde_json::to_string(&ret).unwrap();
    // println!("res:{} {}", res.len(), res);
    let s = CString::new(res).unwrap();
    s.into_raw()
}

///
///
///
#[no_mangle]
#[export_name = "reencrypt_v2"]
pub extern "C" fn __reencrypt_v2(c_param: *const c_char) -> *const c_char {
    let param = cstr2string(c_param);
    // println!("param1 {}", param);
    let param: ReEncryptParam = ReEncryptParam::from_json(&param);
    // println!("param2 {:?}", param);

    let ret = _reencrypt_v2(&param);

    let res = serde_json::to_string(&ret).unwrap();
    // println!("res:{} {}", res.len(), res);
    let s = CString::new(res).unwrap();
    s.into_raw()
}

///
///
///
#[no_mangle]
#[export_name = "decrypt_v2"]
pub extern "C" fn __decrypt_v2(c_param: *const c_char) -> *const c_char {
    let param = cstr2string(c_param);
    // println!("param1 {}", param);
    let param: DecryptParam = DecryptParam::from_json(&param);
    // println!("param2 {:?}", param);

    let ret = _decrypt_v2(&param);

    let res = serde_json::to_string(&ret).unwrap();
    // println!("res:{} {}", res.len(), res);
    let s = CString::new(res).unwrap();
    s.into_raw()
}
