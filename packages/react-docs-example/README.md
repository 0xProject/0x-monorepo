## @0xproject/react-docs-example

An [example documentation page](http://react-docs-example.s3-website-us-east-1.amazonaws.com/) built using [react-docs](https://github.com/0xProject/0x-monorepo/tree/development/packages/react-docs) rendering the [@0xproject/web3-wrapper](https://github.com/0xProject/0x-monorepo/tree/development/packages/web3-wrapper) Typescript package. This is a great starter project for hosting your own Solidity or Typescript documentation page.

## Usage

This package is intended as a boilerplate for creating and hosting your own documentation page. Clone/fork it's contents into a new directory to get started.

#### Install Dependencies

If you don't have yarn workspaces enabled (Yarn < v1.0) - enable them:

```bash
yarn config set workspaces-experimental true
```

Then install dependencies

```bash
yarn install
```

#### Start the dev server

```bash
yarn dev
```

### Deploy Example to S3 bucket

You will need to adapt the `deploy_example` command in the `package.json` to point to an S3 bucket you've created. Make sure the bucket is publicly accessible to everyone.

You will also need to install the [aws-cli](https://github.com/aws/aws-cli) and configure it with your AWS credentials.

```bash
yarn deploy_example
```

### Build

```bash
yarn build
```

### Lint

```bash
yarn lint
```

## Contributing

We strongly encourage the community to help us make improvements. To report bugs within this package, please create an issue in this repository.

Please read our [contribution guidelines](../../CONTRIBUTING.md) before getting started.
