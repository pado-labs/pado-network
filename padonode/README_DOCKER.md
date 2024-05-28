# pado-node
## Quick Start(Docker)
> **NOTE:** This is a quick start guide for Docker. If you want to run pado-network node on your own machine, please refer to [Quick Start](./README.md)

### Install Docker
Please refer to official documentation: [Install Docker Engine](https://docs.docker.com/engine/install/)

### Pull Image
```shell
docker pull padolabs/pado-network:latest
```

### Generate Key
```sh
docker run --rm -v <CONFIG_PATH_ON_HOST>:<CONFIG_PATH_IN_CONTAINER> -e KEY_FILE_PATH=<KEY_FILE_PATH_IN_CONTAINER> --name <CONTAINER_NAME> padolabs/pado-network:latest sh -c "node /pado-network/dist/keygen.js"
```
variables:
- CONFIG_PATH_ON_HOST: Directory on the host machine to mount the container to.
- CONFIG_PATH_IN_CONTAINER: Directory for the configuration file in the container, can be specified arbitrarily.

environments:
- KEY_FILE_PATH: JSON file path to store the keys in the container.

for example:
```sh
docker run --rm -v ./config:/pado-network/config/ -e KEY_FILE_PATH=/pado-network/config/pado-network-key.json --name pado-network padolabs/pado-network:latest sh -c "node /pado-network/dist/keygen.js"
```
You will find `pado-network-key.json` in `./config`

**IMPORTANT!** Don't lose this file and save it to a safe place!


### Create Wallet (Optional)

If you don't have an Arweave wallet, you can install one from [ArConnect](https://www.arconnect.io/download), and then export the wallet from ArConnect and store it to somewhere.

Alternatively, it is possible to generate an Arweave wallet with the following command:

```sh
docker run --rm -v <CONFIG_PATH_ON_HOST>:<CONFIG_PATH_IN_CONTAINER> --name pado-network padolabs/pado-network:latest sh -c "node -e \"require('arweave').init({}).wallets.generate().then(JSON.stringify).then(console.log.bind(console))\" > ${WALLET_PATH_IN_CONTAINER}"
```

variables:
- CONFIG_PATH_ON_HOST: Directory on the host machine to mount the container to.
- CONFIG_PATH_IN_CONTAINER: Directory for the configuration file in the container, can be specified arbitrarily.
- WALLET_PATH_IN_CONTAINER: Path to the wallet file in the container

for example:
```sh
docker run --rm -v ./config:/pado-network/config/ --name pado-network padolabs/pado-network:latest sh -c "node -e \"require('arweave').init({}).wallets.generate().then(JSON.stringify).then(console.log.bind(console))\" > /pado-network/config/wallet.json"
```
You will find `wallet.json` in `./config`

**IMPORTANT!** Don't lose this file and save it to a safe place!

## Register Node Public Key


**NOTE:** Please contact [PADO](https://discord.gg/YxJftNRxhh) to add your wallet address to the **WHITELIST** before being able to successfully register!

You can get you Arweave wallet address from ArConnect or by:

```sh
docker run --rm -v <CONFIG_PATH_ON_HOST>:<CONFIG_PATH_IN_CONTAINER> -e WALLET_PATH=<WALLET_PATH_IN_CONTAINER> --name pado-network padolabs/pado-network:latest sh -c "node /pado-network/dist/getwalletaddress.js"
```
variables:
- CONFIG_PATH_ON_HOST: Directory on the host machine to mount the container to.
- CONFIG_PATH_IN_CONTAINER: Directory for the configuration file in the container, can be specified arbitrarily.

environments:
- WALLET_PATH: Path to the Arweave wallet file in the container
for example:
```sh
docker run --rm -v ./config:/pado-network/config/ -e WALLET_PATH=/pado-network/config/wallet.json --name pado-network padolabs/pado-network:latest sh -c "node /pado-network/dist/getwalletaddress.js"
```

<br/>

Register the node's public key to ao process.


```sh
docker run --rm -v <CONFIG_PATH_ON_HOST>:<CONFIG_PATH_IN_CONTAINER> -e KEY_FILE_PATH=<KEY_FILE_PATH_IN_CONTAINER> -e WALLET_PATH=<WALLET_PATH_IN_CONTAINER> -e NODE_NAME='<PADO_NETWORK_NODE_NAME>' [-e NODE_DESC=<PADO_NETWORK_NODE_DESC>] --name pado-network padolabs/pado-network:latest sh -c "node /pado-network/dist/noderegister.js"
```
variables:
- CONFIG_PATH_ON_HOST: Directory on the host machine to mount the container to.
- CONFIG_PATH_IN_CONTAINER: Directory for the configuration file in the container, can be specified arbitrarily.

environments:
- KEY_FILE_PATH: Path to the key file in the container
- WALLET_PATH: Path to the wallet file in the container
- NODE_NAME: The name of the node
- NODE_DESC: The description of the node. The default value is `the description of ${name}`.

for example:
```shell
docker run --rm -v ./config:/pado-network/config/ -e KEY_FILE_PATH=/pado-network/config/pado-network-key.json -e WALLET_PATH=/pado-network/config/wallet.json -e NODE_NAME='pado-network' --name pado-network padolabs/pado-network:latest sh -c "node /pado-network/dist/noderegister.js"
```

If the output is like `register ... by ...`, it means that the node has been successfully registered. If the output is like `already register ...`, it means that this node name has already been registered.

<br/>

In general, you only need to perform the above steps once.


## Do task

Once successfully registered, you can start the task program.
```sh
docker run -d -v <CONFIG_PATH_ON_HOST>:<CONFIG_PATH_IN_CONTAINER> -e KEY_FILE_PATH=<KEY_FILE_PATH_IN_CONTAINER> -e WALLET_PATH=<WALLET_PATH_IN_CONTAINER>  --name pado-network --restart always padolabs/pado-network:latest
```
variables:
- CONFIG_PATH_ON_HOST: Directory on the host machine to mount the container to.
- CONFIG_PATH_IN_CONTAINER: Directory for the configuration file in the container, can be specified arbitrarily.

environments:
- KEY_FILE_PATH: Path to the key file in the container
- WALLET_PATH: Path to the wallet file in the container
for example:
```sh
docker run -d -v ./config:/pado-network/config/ -e KEY_FILE_PATH=/pado-network/config/pado-network-key.json -e WALLET_PATH=/pado-network/config/wallet.json  --name pado-network --restart always padolabs/pado-network:latest
```
then you can use `docker ps` to check the status of the container. such as:
```shell
$ docker ps
CONTAINER ID   IMAGE                          COMMAND                   CREATED         STATUS        PORTS                                                         NAMES
dcf4910bfc2f   padolabs/pado-network:latest   "docker-entrypoint.s…"   2 seconds ago   Up 1 second                                                                 pado-network
```
and you can use `docker logs pado-network` to check the log of the container.

### Start with docker-compose

> NOTE: A simpler deployment method is to use docker-compose([Install Compose](https://docs.docker.com/compose/install/standalone/)). here is an example.

```yaml
version: "3"
services:
  pado-network:
    container_name: pado-network
    image: padolabs/pado-network:latest
    restart: always
    environment:
      - KEY_FILE_PATH=/pado-network/config/pado-network-key.json
      - WALLET_PATH=/pado-network/config/wallet.json
    volumes:
      - ./config:/pado-network/config/
```
Save the above to the `docker-compose.yaml` file and change the parameters in volumes and environment. Execute command：
```shell
docker-compose -f docker-compose.yaml up -d
```
then you can use `docker ps` to check the status of the container. 

