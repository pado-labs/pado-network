
- [Overview](#overview)
- [APIs](#apis)
  - [KeyGen](#keygen)
  - [Encrypt](#encrypt)
  - [ReEncrypt](#reencrypt)
  - [Decrypt](#decrypt)


## Overview


**APIs corresponding to roles:**

- PADO Node, Compute node
  - [step1 KeyGen](#keygen)
  - [step4 ReEncrypt](#reencrypt)
- Data Provider, Seller
  - [step2 Encrypt](#encrypt)
- Data Consumer, Buyer
  - [step3. KeyGen](#keygen)
  - [step5. Decrypt](#decrypt)

<br/>

**Notes:**

- All **Input** and **Output** are json.


## APIs


### KeyGen

- for `Data Consumer` and `PADO Node`

**Input**

```json
{
  "t": 2,
  "n": 3,             // n >= 3; n >= t >= 1
  "indices": [1,2,3]  // the pado node index, start from 1
}
```

**Output**

```json
{
  "sk": {}, // secret key
  "pk": []  // public key
}
```

### Encrypt

- only for `Data Provider`

 
**Input**

```json
{
  "t": 2,
  "n": 3,         // n >= 3; n >= t >= 1
  "indices": [],  // pado node index, start from 1
  "pks": [],      // pado node public keys, which length is equal to n
  "msg": []       // plain message
}
```

**Output**

```json
{
  "enc_sks": [],  // encrypted secret keys, which length is equal to n
  "nonce": [],    // nonce
  "enc_msg": []   // encrypted message
}
```



### ReEncrypt

- only for `PADO Node`


**Input**

```json
{
  "t": 2,
  "n": 3,           // n >= 3; n >= t >= 1
  "indices": [],    // pado node index, start from 1
  "enc_sk": [],     // data provider encrypted secrect key
  "node_sk": {},    // pado node secrect key
  "consumer_pk": [] // consumer publick key
}
```



**Output**

```json
{
  "re_enc_sk": [] // re-encrypted secrect key
}
```



### Decrypt

- only for `Data Consumer`


**Input**

```json
{
  "t": 2,
  "n": 3,               // n >= 3; n >= t >= 1
  "indices": [],        // pado node index, start from 1
  "re_enc_sks": [],     // re-encrypted secrect keys
  "chosen_indices": [], // selected nodes for computing
  "consumer_sk": {},    // consumer secrect key
  "nonce": [],          // nonce
  "enc_msg": []         // encrypted message
}
```



**Output**

```json
{
  "msg": [] // decrypted message
}
```

