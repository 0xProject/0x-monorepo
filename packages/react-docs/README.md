## @0xproject/react-docs

A full-page React component for rendering beautiful documentation for Solidity and Typescript code generated with [TypeDoc](http://typedoc.org/) or [Doxity](https://github.com/0xproject/doxity). See a [live example](http://react-docs-example.s3-website-us-east-1.amazonaws.com/).

<div style="text-align: center;">
<img src="https://s3.eu-west-2.amazonaws.com/0x-wiki-images/screenshot.png" style="padding-bottom: 20px; padding-top: 20px;" width="80%" />
<div>react-docs generating 0x's smart contract docs</div>
</div>

#### Features

*   Mobile optimized
*   Reads Javadoc-style comments in your code to generate class/method/argument/return/type comments.
*   Syntax highlighting support for TypeScript & Solidity
*   Type declaration linking
*   Type declaration popovers to avoid clicking through to the definition
*   Section/method/type anchors for easily pointing others to a specific part of your docs.
*   Version picker
*   Customizable sidebar header
*   Supports custom markdown sections so you can easily add an intro or installation instructions.

## Installation

```bash
yarn add @0xproject/react-docs
```

## Usage

View the [live example](http://react-docs-example.s3-website-us-east-1.amazonaws.com/) that renders the [@0xproject/web3-wrapper](https://github.com/0xProject/0x-monorepo/tree/development/packages/web3-wrapper) Typescript package. It's source code is in the [example directory](./example).

This package exposes both a single `Documentation` react component that will render a docs page, as well as all of it's sub-components in case someone wants to build their own layout.

Currently this package still has some external dependencies outside of the `Documentation` component, so please start your project off by copying the `example` directory and modifying from there.

## Future improvements

Feel free to contribute to these improvements!

*   Allow user to pass in styling for all major elements similar to [Material-UI](http://www.material-ui.com/).
*   Allow user to define an alternative font and have it change everywhere.
*   Add source links to Solidity docs (currently unsupported by Doxity).

## Contributing

We strongly encourage the community to help us make improvements. To report bugs within this package, please create an issue in this repository.

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

### Build

```bash
yarn build
```

### Lint

```bash
yarn lint
```

### Run Example

```bash
yarn dev
```

### Deploy Example to S3 bucket

You will need to adapt the `deploy_example` command in the `package.json` to point to an S3 bucket you've created. Make sure the bucket is publicly accessible to everyone.

You will also need to install the [aws-cli](https://github.com/aws/aws-cli) and configure it with your AWS credentials.

```bash
yarn deploy_example
```
