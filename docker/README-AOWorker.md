- [AO Worker](#ao-worker)


# AO Worker

## Configurations

Copy `./config-files/.env.ao` into `./.env`. Edit the `./.env` and update the values for your own setups.


<br/>

### Node Info

Set a name to identify yourself, these will be used on the node itself and will be shown on performance metrics in the future.

```conf
# Set a name to identify yourself
NODE_NAME="Your Node Name"
NODE_DESCRIPTION="Your Node Name's Description"
```


### ArWallet

If you don't have an AR wallet, you can install one from [ArConnect](https://www.arconnect.io/download), and then export the wallet from ArConnect and store it to somewhere.

Next, fill in the file path of the AR wallet,

```conf
#
# AR Wallet, for storage
#
AR_WALLET_PATH='/path/to/your/arwallet.json'
```


### LHE Key

The LHE key is used for data sharing, use the following command to generate it.

```sh
bash ./run.sh generate-lhe-key [--key-name <NAME>]
```

The default output is `./keys/default.lhe.key.json`, you can specify the key name via `--key-name <NAME>`.


Next, fill in the file path of the LHE key you have generated.

```conf
#
# LHE KEY
# For task: data sharing
#
LHE_KEY_PATH='/path/to/your/lhe.key.json'
```


## Storage

Storing data on a contract is expensive, so we use [arweave](https://www.arweave.org/) which is cheaper to store data.

In order to use [Arseeding](https://web3infra.dev/docs/arseeding/introduction/lightNode), you need to first transfer some AR to [everPay](https://app.everpay.io/), which wallet corresponds to the ArWallet previously mentioned above.

Alternatively, you can deposit on EverPay with the following command:

```sh
# here set your own wallet path
export WALLET_PATH=/path/to/your/wallet.json
# here set your own AMOUNT
bash ./utils.sh everpay:deposit --chain arweave --symbol AR --amount <AMOUNT>
# e.g.:
# bash ./utils.sh everpay:deposit --chain arweave --symbol AR --amount 0.00001
```

Meanwhile, you can check the balance on EverPay by:

```sh
bash ./utils.sh everpay:balance --account <ACCOUNT_ADDRESS> --symbol AR
```


## Registry

**NOTE:** *Please contact [PADO Labs](https://discord.gg/YxJftNRxhh) to add your wallet address to the WHITELIST before being able to successfully register!*

Once the configuration is complete, you can run:

```sh
bash ./run.sh ao:register
```

<br/>

In general, you only need to perform the registry steps once.


## Run Task

Once successfully registered, you can start the task program. If necessary, e.g. in a production environment, it is recommended to start the program as a background process.


```sh
bash ./run.sh dotask [<name>]
```

The container-name is `pado-network[-name]`.

