Contracts
-----

## Useful 0x Wiki Articles

* [Architecture](https://0xproject.com/wiki#Architecture)
* [Contract Interactions](https://0xproject.com/wiki#Contract-Interactions)
* [Contract deployed addresses](https://0xproject.com/wiki#Deployed-Addresses)
* [0x Protocol Message Format](https://0xproject.com/wiki#Message-Format)
* [Bug Bounty Program](https://0xproject.com/wiki#Bug-Bounty)

## Setup

### Installing Dependencies

Install [Node](https://nodejs.org/en/download/releases/)

Install [yarn](https://yarnpkg.com/lang/en/docs/install/) in order to install the project dependencies more deterministically.

Install project dependencies:

```
yarn
```

### Running Tests

Start Testrpc

```
yarn testrpc
```

Run tests

```
yarn test
```

## Contributing

0x protocol is intended to serve as an open technical standard for EVM blockchains and we strongly encourage our community members to help us make improvements and to determine the future direction of the protocol. To report bugs within the 0x smart contracts or unit tests, please create an issue in this repository.

### ZEIPs
Significant changes to 0x protocol's smart contracts, architecture, message format or functionality should be proposed in the [0x Improvement Proposals (ZEIPs)](https://github.com/0xProject/ZEIPs) repository. Follow the contribution guidelines provided therein.

### Coding conventions

We use a custom set of [TSLint](https://palantir.github.io/tslint/) rules to enforce our coding conventions.

In order to see style violation errors, install a tslinter for your text editor. e.g Atom's [atom-typescript](https://atom.io/packages/atom-typescript).
