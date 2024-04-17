
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


**Output**



### Encrypt

- only for `Data Provider`

 
**Input**



**Output**



### ReEncrypt

- only for `PADO Node`


**Input**



**Output**



### Decrypt

- only for `Data Consumer`


**Input**



**Output**

