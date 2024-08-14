
- [pado-node](#pado-node)
  - [Install](#install)
  - [Guides](#guides)
  - [A brief summary of command lines](#a-brief-summary-of-command-lines)
    - [LHE Key](#lhe-key)
    - [EigenLayer](#eigenlayer)
    - [AO](#ao)
    - [Task](#task)


# pado-node

Here introduces how to run a node using docker.


## Install

Please reference to official documentation: [Install Docker Engine](https://docs.docker.com/engine/install/).

Next, pull the image:

```shell
docker pull padolabs/pado-network:latest
```


## Guides

- [EigenLayer Worker](./README-EigenLayerWorker.md)
- [AO Worker](./README-AOWorker.md)



## A brief summary of command lines

### LHE Key

```sh
bash ./run.sh generate-lhe-key
```

### EigenLayer

```sh
bash ./run.sh el:register-as-operator
bash ./run.sh el:register
bash ./run.sh el:get-operator-id
```

### AO

```sh
bash ./run.sh ao:register
bash ./run.sh ao:update
bash ./run.sh ao:deregister
```


### Task

```sh
bash ./run.sh dotask [<name>]
```


```sh
docker start pado-network[-name]
docker stop pado-network[-name]
docker rm pado-network[-name]
docker logs pado-network[-name]
docker logs -f pado-network[-name]
```


others:

```sh
docker compose -f docker-compose.yaml up -d
```

```sh
docker compose -f docker-compose-ao.yaml up -d
docker compose -f docker-compose-el.yaml up -d
```

