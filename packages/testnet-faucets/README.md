## @0xproject/testnet-faucets

This faucet dispenses 0.1 test ether to one recipient per second and 0.1 test ZRX every 5 seconds. It has a max queue size of 1000.

## Installation

This is a private package and therefore is not published to npm. In order to build and run this package locally, see the [Install Dependencies](#Install-Dependencies) section and onwards below.

## Contributing

We strongly recommend that the community help us make improvements and determine the future direction of the protocol. To report bugs within this package, please create an issue in this repository.

Please read our [contribution guidelines](../../CONTRIBUTING.md) before getting started.

### Install Dependencies

If you don't have yarn workspaces enabled (Yarn < v1.0) - enable them:

```bash
yarn config set workspaces-experimental true
```

Then install dependencies

```bash
yarn install
```

### Start

Set the following environment variables:

```bash
export DISPENSER_ADDRESS=0x5409ed021d9299bf6814279a6a1411a7e866a631
export DISPENSER_PRIVATE_KEY=f2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e0164837257d
export FAUCET_ROLLBAR_ACCESS_KEY={GET_THIS_FROM_ROLLBAR_ACCOUNT_SETTINGS}
export INFURA_API_KEY={GET_THIS_FROM_INFURA}
```

If you want to talk to testrpc, set the following environment variable:

```bash
export FAUCET_ENVIRONMENT=development
```

Infura API Key can be requested here: https://infura.io/signup

Note: The above public/private keys exist when running `testrpc` with the following option `--mnemonic concert load couple harbor equip island argue ramp clarify fence smart topic`.

```bash
yarn dev
```

### Endpoints

`GET /ping`

Returns `pong`

`GET /info`

Returns a JSON payload describing the state of the queues for each network. For example:

```json
{
	"3": {
		"ether": {
			"full": false,
			"size": 4
		},
		"zrx": {
			"full": false,
			"size": 6
		}
	},
	"42": {
		"ether": {
			"full": false,
			"size": 8
		},
		"zrx": {
			"full": false,
			"size": 20
		}
	}
}
```

`GET /ether/:recipient`

Where recipient is a hex encoded Ethereum address prefixed with `0x`.

`GET /zrx/:recipient`

Where recipient is a hex encoded Ethereum address prefixed with `0x`.

#### Parameters

The endpoints `/ether` and `/zrx` take a query parameter named `networkId` to specify the desired network where you would like to receive the ETH or ZRX. For example:

```bash
curl -i http://localhost:3000/ether/0x14e2F1F157E7DD4057D02817436D628A37120FD1\?networkId=3
```

This command will request the local server to initiate a transfer of 0.1 ETH from the dispensing address to `0x14e2F1F157E7DD4057D02817436D628A37120FD1` on the Ropsten testnet.

If no `networkId` is provided via query parameters the faucet will default to network 42 (Kovan)

### Docker configs

```
docker run -d \
-p 80:3000 \
--name testnet-faucets \
--log-opt max-size=100m \
--log-opt max-file=20 \
-e DISPENSER_ADDRESS=$DISPENSER_ADDRESS \
-e DISPENSER_PRIVATE_KEY=$DISPENSER_PRIVATE_KEY \
-e FAUCET_ROLLBAR_ACCESS_KEY=$FAUCET_ROLLBAR_ACCESS_KEY \
-e FAUCET_ENVIRONMENT=production \
-e INFURA_API_KEY=$INFURA_API_KEY \
testnet-faucets
```

### Lint

```bash
yarn lint
```
