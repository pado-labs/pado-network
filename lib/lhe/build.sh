#!/bin/bash
cargo fmt

# build on host
cargo build --release

# build on wasm
FLAGS=""
FLAGS+=" -s EXPORTED_RUNTIME_METHODS=allocateUTF8,stringToUTF8,UTF8ToString,ccall,wasmMemory"
FLAGS+=" -s EXPORTED_FUNCTIONS=_main,_malloc,_free,_free_cptr,_keygen,_encrypt,_reencrypt,_decrypt"
FLAGS+=" -sSTACK_SIZE=1MB -sINITIAL_MEMORY=512MB -sMAXIMUM_MEMORY=4GB"
FLAGS+=" -sALLOW_MEMORY_GROWTH"
FLAGS+=" -sIMPORTED_MEMORY"
FLAGS+=" -s NO_EXIT_RUNTIME=1"
export EMCC_CFLAGS=${FLAGS}
cargo +nightly build --target wasm32-unknown-emscripten --release

cp ./target/wasm32-unknown-emscripten/release/lhe.js ./
cp ./target/wasm32-unknown-emscripten/release/lhe.wasm ./
