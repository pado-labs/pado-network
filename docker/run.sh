#!/bin/bash
CMD='node ./dist/cmd.js'
pado_net_worker_image=padolabs/pado-network:latest

# ################################################
. ./.env
mapped_lhe_key=
mapped_ecdsa_key=
mapped_bls_key=
mapped_ar_wallet=
if [ ${LHE_KEY_PATH} ]; then
  mapped_lhe_key="-v ${LHE_KEY_PATH}:/pado-network/keys/lhe_key.json"
fi
if [ "${ENABLE_EIGEN_LAYER}" = "true" ]; then
  if [ ${ECDSA_KEY_FILE} ]; then
    mapped_ecdsa_key="-v ${ECDSA_KEY_FILE}:/pado-network/keys/ecdsa_key.json"
  fi
  if [ ${BLS_KEY_FILE} ]; then
    mapped_bls_key="-v ${BLS_KEY_FILE}:/pado-network/keys/bls_key.json"
  fi
fi
if [ "${ENABLE_AO}" = "true" ]; then
  if [ ${AR_WALLET_PATH} ]; then
    mapped_ar_wallet="-v ${AR_WALLET_PATH}:/pado-network/keys/ar_wallet.json"
  fi
fi

mapped_keys="${mapped_ecdsa_key} ${mapped_bls_key} ${mapped_lhe_key} ${mapped_ar_wallet}"
# echo ${mapped_ecdsa_key}
# echo ${mapped_bls_key}
# echo ${mapped_lhe_key}
# echo ${mapped_ar_wallet}
# echo ${mapped_keys}
# ################################################

function usage() {
  docker run --rm \
    ${pado_net_worker_image} \
    ${CMD} $@
}

function generate_lhe_key() {
  docker run --rm \
    -v ./keys/:/pado-network/keys/ \
    ${pado_net_worker_image} \
    ${CMD} $@
}

function el_register_as_operator() {
  docker run --rm --env-file .env ${mapped_keys} \
    ${pado_net_worker_image} \
    ${CMD} $@
}

function el_register() {
  docker run --rm --env-file .env ${mapped_keys} \
    ${pado_net_worker_image} \
    ${CMD} $@
}

function general_cmd() {
  docker run --rm --env-file .env ${mapped_keys} \
    ${pado_net_worker_image} \
    ${CMD} $@
}

function run_task() {
  _name=
  if [ $# -ge 1 ]; then
    _name="-$1"
  fi
  docker run -d --env-file .env ${mapped_keys} \
    -v ./logs:/pado-network/logs/ \
    --restart unless-stopped \
    --name pado-network${_name} \
    ${pado_net_worker_image} \
    node ./dist/main.js
}

cmd=$1
if [ "${cmd}" = "-h" ] || [ "${cmd}" = "--help" ]; then
  usage ${cmd}
elif [ "${cmd}" = "generate-lhe-key" ]; then
  generate_lhe_key $@
#
# EigenLayer
elif [ "${cmd}" = "el:register-as-operator" ]; then
  general_cmd $@
elif [ "${cmd}" = "el:register" ]; then
  general_cmd $@
elif [ "${cmd}" = "el:get-operator-id" ]; then
  general_cmd $@
#
# AOs
elif [ "${cmd}" = "ao:register" ]; then
  general_cmd $@
elif [ "${cmd}" = "ao:update" ]; then
  general_cmd $@
elif [ "${cmd}" = "ao:deregister" ]; then
  general_cmd $@
#
# Task
elif [ "${cmd}" = "dotask" ]; then
  # dotask [name]
  shift 1
  run_task $@
else
  echo "invalid command: ${cmd}"
fi
