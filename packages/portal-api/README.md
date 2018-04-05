## @0xproject/portal-api

This service serves information to the [portal dApp](https://0xproject.com/portal)

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

Set the following environment variables or create a [.env](https://github.com/motdotla/dotenv) file in the root directory of your project.

bash:

```bash
export AURORA_USER={GET_THIS_FROM_AWS}
export AURORA_DB={GET_THIS_FROM_AWS}
export AURORA_PASSWORD={GET_THIS_FROM_AWS}
export AURORA_PORT={GET_THIS_FROM_AWS}
export AURORA_HOST={GET_THIS_FROM_AWS}
export ROLLBAR_ACCESS_KEY={GET_THIS_FROM_ROLLBAR_ACCOUNT_SETTINGS}
```

.env file:

```
AURORA_USER={GET_THIS_FROM_AWS}
AURORA_DB={GET_THIS_FROM_AWS}
AURORA_PASSWORD={GET_THIS_FROM_AWS}
AURORA_PORT={GET_THIS_FROM_AWS}
AURORA_HOST={GET_THIS_FROM_AWS}
ROLLBAR_ACCESS_KEY={GET_THIS_FROM_ROLLBAR_ACCOUNT_SETTINGS}
```

```bash
yarn dev
```

### Endpoints

`GET /ping`

Returns `pong`

`GET /prices?tokens=:tokens`

Gets price information for a set of tokens where `tokens` is a string of comma delimited token symbols

#### Example

Request:

```bash
curl -i http://localhost:3000/prices\?tokens\=MKR,ZRX,OMG
```

Returns:

```json
[
    { "symbol": "MKR", "base": "USD", "price": "512.000000000000000000" },
    { "symbol": "ZRX", "base": "USD", "price": "0.582400000000000000" },
    { "symbol": "OMG", "base": "USD", "price": "9.550000000000000000" }
]
```

### Docker configs

```
docker run -d \
-p 80:3000 \
--name portal-api \
--log-opt max-size=100m \
--log-opt max-file=20 \
-e AURORA_USER=$AURORA_USER \
-e AURORA_DB=$AURORA_DB \
-e AURORA_PASSWORD=$AURORA_PASSWORD \
-e AURORA_PORT=AURORA_PORT \
-e AURORA_HOST=$AURORA_HOST \
-e ROLLBAR_ACCESS_KEY=$ROLLBAR_ACCESS_KEY \
-e NODE_ENV=production \
portal-api
```

### Lint

```bash
yarn lint
```
