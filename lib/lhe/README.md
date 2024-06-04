# The WASM wrapper for threshold-zk-LHE

## Quick Start

```sh
cargo build --release

export EMCC_CFLAGS=' -s EXPORTED_RUNTIME_METHODS=allocateUTF8,stringToUTF8,UTF8ToString,ccall,wasmMemory -s EXPORTED_FUNCTIONS=_main,_malloc,_free,_free_cptr,_keygen,_encrypt,_reencrypt,_decrypt -sSTACK_SIZE=1MB -sINITIAL_MEMORY=512MB -sMAXIMUM_MEMORY=4GB -sALLOW_MEMORY_GROWTH -sIMPORTED_MEMORY -s NO_EXIT_RUNTIME=1'
cargo +nightly build --target wasm32-unknown-emscripten --release
```

## Local Test

```sh
cp ./target/wasm32-unknown-emscripten/release/lhe.js ./
cp ./target/wasm32-unknown-emscripten/release/lhe.wasm ./

python -m http.server
```

Open Chrome, type `http://127.0.0.1:8000` and click the `TestAll` button.


## Documents

- [API](./doc/API.md).

