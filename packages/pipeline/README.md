## @0xproject/pipeline

This repository contains scripts used for scraping data from the Ethereum blockchain into SQL tables for analysis by the 0x team.

## Contributing

We strongly recommend that the community help us make improvements and determine the future direction of the protocol. To report bugs within this package, please create an issue in this repository.

Please read our [contribution guidelines](../../CONTRIBUTING.md) before getting started.

## Local Dev Setup

Requires Node version 6.9.5 or higher.

Add the following to your `.env` file:

```
REDSHIFT_USER
REDSHIFT_DB
REDSHIFT_PASSWORD
REDSHIFT_PORT
REDSHIFT_HOST
WEB3_PROVIDER_URL
```

Running a script example:

```
node ./lib/scripts/scrape_data.js --type tokens
```

### Install dependencies:

```bash
yarn install
```

### Build

```bash
yarn build
```

### Clean

```bash
yarn clean
```

### Lint

```bash
yarn lint
```
