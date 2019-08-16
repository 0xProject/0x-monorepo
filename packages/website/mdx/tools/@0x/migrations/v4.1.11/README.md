## Migrations

Migrate the 0x system of smart contracts on the network of your choice using these migrations.

## Contributing

We welcome improvements and fixes from the wider community! To report bugs within this package, please create an issue in this repository.

Please read our [contribution guidelines](../../CONTRIBUTING.md) before getting started.

### Install dependencies

If you don't have yarn workspaces enabled (Yarn < v1.0) - enable them:

```bash
yarn config set workspaces-experimental true
```

Then install dependencies

```bash
yarn install
```

### Build

To build this package and all other monorepo packages that it depends on, run the following from the monorepo root directory:

```bash
PKG=@0x/migrations yarn build
```

Or continuously rebuild on change:

```bash
PKG=@0x/migrations yarn watch
```

### Clean

```bash
yarn clean
```

### Lint

```bash
yarn lint
```

### Migrate

#### V2 smart contracts

In order to migrate the V2 0x smart contracts to TestRPC/Ganache running at `http://localhost:8545`, run:

```bash
yarn migrate:v2
```

### Publish

#### 0x Ganache Snapshot

The 0x Ganache snapshot can be generated and published in this package. In order to build the snapshot for this version of migrations run:

```bash
yarn build:snapshot
```

This will run the migrations in Ganache and output a zip file to be uploaded to the s3 bucket. For example, after running this command you will have created `0x_ganache_snapshot-2.2.2.zip`. To publish the zip file to the s3 bucket run:

```bash
yarn publish:snapshot
```

This snapshot will now be publicly available at http://ganache-snapshots.0x.org.s3.amazonaws.com/0x_ganache_snapshot-latest.zip and also versioned with the package.json version.

#### 0x Ganache Docker Image

We also publish a simple docker image which downloads the latest snapshot, extracts and runs Ganache. This is not required to be built when migrations change as it always downloads and runs the latest zip file. If you have made changes to the Dockerfile then a publish of the image is required. To do this run:

```bash
yarn build:snapshot:docker
yarn publish:snapshot:docker
```

The result is a published docker image to the 0xorg docker registry. To start the docker image run:

```bash
docker run -p 8545:8545 -ti 0xorg/ganache-cli:latest
```

This will pull the latest zip in the s3 bucket, extract and start Ganache with the snapshot.

In the event you need a specific version of the published Ganache snapshot run the following specifying the VERSION environment variable:

```bash
docker run -e VERSION=2.2.2 -p 8545:8545 -ti 0xorg/ganache-cli:latest
```

#### Production

If deploying contract changes to mainnet, `@0x/contract-artifacts` should also be updated and published. The artifacts must be copied from each `contracts/{package-name}/generated-artifacts/{contract}.json`.