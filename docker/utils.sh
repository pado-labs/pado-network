#!/bin/bash
CMD='node ./dist/cmd.js'
pado_net_worker_image=padolabs/pado-network:latest

# ################################################
mapped_wallet=
if [ ${WALLET_PATH} ]; then
  mapped_wallet="-v ${WALLET_PATH}:/pado-network/keys/wallet.json"
fi
# echo ${mapped_wallet}
# ################################################

function eveypay_balance() {
  docker run --rm \
    ${pado_net_worker_image} \
    ${CMD} $@
}

function eveypay_deposit() {
  docker run -it --rm ${mapped_wallet} \
    ${pado_net_worker_image} \
    ${CMD} $@
}

cmd=$1
if [ "${cmd}" = "everpay:balance" ]; then
  eveypay_balance $@
elif [ "${cmd}" = "everpay:deposit" ]; then
  eveypay_deposit $@
else
  echo "invalid command: ${cmd}"
fi
