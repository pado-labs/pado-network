# pado-network


In the first stage, we implemented PADO Node. Each node first registers its public key to AO, after which it fetches tasks from AO, performs re-encryption and submits the result to AO.


## Components

- The [PADO Node](./padonode/README.md) of the PADO Networks.
- The [WASM wrapper](./lib/lhe/README.md) for [threshold-zk-LHE](https://github.com/pado-labs/threshold-zk-LHE).
