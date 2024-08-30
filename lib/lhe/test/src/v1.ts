import { keygen, encrypt, reencrypt, decrypt } from "./lhe";

const test = async (data_len: number) => {
  console.log('beg memory(MB):', process.memoryUsage.rss() / 1024 / 1024, data_len);

  await new Promise(resolve => setTimeout(resolve, 1000));

  let key1 = keygen();
  let key2 = keygen();
  let key3 = keygen();
  let keyC = keygen();


  let pks = [key1.pk, key2.pk, key3.pk];

  // console.log('os mem: ', os.totalmem() / 1024 / 1024, os.freemem() / 1024 / 1024);
  console.log('new data memory 1:', process.memoryUsage.rss());
  let data = new Uint8Array(data_len);
  for (let i = 0; i < data.length; i++) {
    data[i] = Math.floor(Math.random() * 100);
  }
  console.log("data:", data.slice(0, 6));
  // let data = new Uint8Array([1,2,3,8,69]);
  console.log('new data memory 2:', process.memoryUsage.rss());


  console.log('encrypt memory 1:', process.memoryUsage.rss());
  let enc = encrypt(pks, data);
  console.log('encrypt memory 2:', process.memoryUsage.rss());
  console.log('enc.enc_msg.length', enc.enc_msg.length);


  console.log('re-encrypt memory 1:', process.memoryUsage.rss());
  let c1 = reencrypt(enc.enc_sks[0], key1.sk, keyC.pk);
  let c2 = reencrypt(enc.enc_sks[1], key2.sk, keyC.pk);
  let c3 = reencrypt(enc.enc_sks[2], key3.sk, keyC.pk);
  console.log('re-encrypt memory 2:', process.memoryUsage.rss());


  console.log('decrypt memory 1:', process.memoryUsage.rss());
  let reenc_sks = [c1.reenc_sk, c2.reenc_sk, c3.reenc_sk];
  let dec = decrypt(reenc_sks, keyC.sk, enc.nonce, enc.enc_msg, [1, 2, 3]);
  console.log('decrypt memory 2:', process.memoryUsage.rss());
  console.log("decrypted_msg:", dec.msg.slice(0, 6));
  console.log(" original_msg:", data.slice(0, 6));

  console.log('end memory(MB):', process.memoryUsage.rss() / 1024 / 1024, data_len);
}

if (require.main === module) {
  test(12);
  // memory test
  // test(1 * 1024 * 1024);
  // test(1 * 1024 * 1024);
  // test(10 * 1024 * 1024);
  // test(10 * 1024 * 1024);
  // test(100 * 1024 * 1024);
  // test(100 * 1024 * 1024);
}
