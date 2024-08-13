#!/bin/bash

pado_net_worker_image=padolabs/pado-network:latest

function generate_lhe_key() {
  docker run --rm \
    -v ./keys/:/pado-network/keys/ \
    ${pado_net_worker_image} \
    node ./dist/cmd.js generate-lhe-key --output ./keys/lhe.key.json
}

function register_as_operator() {
  . ./.env
  docker run --rm --env-file .env \
    -v ${ECDSA_KEY_FILE}:/pado-network/keys/ecdsa_key.json \
    -v ${BLS_KEY_FILE}:/pado-network/keys/bls_key.json \
    -v ${LHE_KEY_PATH}:/pado-network/keys/lhe_key.json \
    ${pado_net_worker_image} \
    node dist/cmd.js register-as-operator
}

function register_pado_avs() {
  . ./.env
  docker run --rm --env-file .env \
    -v ${ECDSA_KEY_FILE}:/pado-network/keys/ecdsa_key.json \
    -v ${BLS_KEY_FILE}:/pado-network/keys/bls_key.json \
    -v ${LHE_KEY_PATH}:/pado-network/keys/lhe_key.json \
    ${pado_net_worker_image} \
    node dist/cmd.js register:pado-avs --quorum-id-list 0
}

cmd=$1
if [ "${cmd}" = "generate-lhe-key" ]; then
  generate_lhe_key
elif [ "${cmd}" = "register:as-operator" ]; then
  register_as_operator
elif [ "${cmd}" = "register:pado-avs" ]; then
  register_pado_avs
else
  echo "invalid command: ${cmd}"
fi
