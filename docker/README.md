
TODO...


## Command Lines

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
docker compose -f docker-compose.yaml up -d
```

```sh
docker compose -f docker-compose-ao.yaml up -d
docker compose -f docker-compose-el.yaml up -d
```

