Test Ether Faucet
----------------------

This faucet dispenses 0.1 test ether to one recipient per second. It has a max queue size of 1000.


## Install

Install project dependencies:

```
npm install
```

## Start

Set the following environment variables:

```
export FAUCET_ENVIRONMENT=development
export DISPENSER_ADDRESS=0x5409ed021d9299bf6814279a6a1411a7e866a631
export DISPENSER_PRIVATE_KEY=f2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e0164837257d
export FAUCET_ROLLBAR_ACCESS_KEY={GET_THIS_FROM_ROLLBAR_ACCOUNT_SETTINGS}
```

Note: The above public/private keys exist when running `testrpc` with the following option `--mnemonic concert load couple harbor equip island argue ramp clarify fence smart topic`.

The real production key with kovan ETH exist in 1password

```
npm run dev
```

## Endpoints

```GET /rain/:recipient_address```

Where recipient_address is a hex encoded Ethereum address prefixed with `0x`.

```GET /queue```

Returns the status of the queue

```javascript
{
    "full": false,
    "size": 0
}
```

## Docker configs

```
docker run -d \
-p 80:3000 \
--name kovan-faucets \
--log-opt max-size=100m \
--log-opt max-file=20 \
-e DISPENSER_ADDRESS=$DISPENSER_ADDRESS \
-e DISPENSER_PRIVATE_KEY=$DISPENSER_PRIVATE_KEY \
-e FAUCET_ROLLBAR_ACCESS_KEY=$FAUCET_ROLLBAR_ACCESS_KEY \
-e FAUCET_ENVIRONMENT=production \
kovan-faucets
```
