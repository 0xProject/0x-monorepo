# ABI Gen

This package allows you to generate TypeScript contract wrappers from ABI files.
It's heavily inspired by [Geth abigen](https://github.com/ethereum/go-ethereum/wiki/Native-DApps:-Go-bindings-to-Ethereum-contracts) but takes a different approach.
You can write your custom handlebars templates which will allow you to seamlessly integrate the generated code into your existing codebase with existing conventions.

For an example of the generated [wrapper files](https://github.com/0xProject/0x-monorepo/tree/development/packages/0x.js/src/contract_wrappers/generated) check out 0x.js.
[Here](https://github.com/0xProject/0x-monorepo/tree/development/packages/0x.js/contract_templates) are the templates used to generate those files.

## Installation

`yarn add -g @0xproject/abi-gen`

## Usage

```
abi-gen
Options:
  --help               Show help                                       [boolean]
  --version            Show version number                             [boolean]
  --abis               Glob pattern to search for ABI JSON files
                                                             [string] [required]
  --output, -o, --out  Folder where to put the output files  [string] [required]
  --partials           Glob pattern for the partial template files      [string]
  --template           Path for the main template file that will be used to
                       generate each contract                [string] [required]
  --backend            The backing Ethereum library your app uses. Either 'web3'
                       or 'ethers'. Ethers auto-converts small ints to numbers
                       whereas Web3 doesn't.
                          [string] [choices: "web3", "ethers"] [default: "web3"]
  --network-id         ID of the network where contract ABIs are nested in
                       artifacts                          [number] [default: 50]
```

You're required to pass a [glob](<https://en.wikipedia.org/wiki/Glob_(programming)>) template where your abi files are located.
TL;DR - here is the example from 0x.js.

`--abis 'src/artifacts/@(Exchange|Token|TokenTransferProxy|EtherToken|TokenRegistry).json`

We could've just used `--abis 'src/artifacts/*.json` but we wanted to exclude some of the abi files.

The abi file should be either a [Truffle](http://truffleframework.com/) contract artifact (a JSON object with an abi key) or a JSON abi array.

You need to also specify the location of your main template used for every contract `--template` as well as the partial templates `--partials` that can later be used from the main one.

## How to write custom templates?

The best way to get started is to copy [0x.js templates](https://github.com/0xProject/0x-monorepo/tree/development/packages/0x.js/contract_templates) and start adjusting them for your needs.
We use [handlebars](http://handlebarsjs.com/) template engine under the hood.
You need to have a master template called `contract.mustache`. it will be used to generate each contract wrapper. Although - you don't need and probably shouldn't write all your logic in a single template file. You can write [partial templates](http://handlebarsjs.com/partials.html) and as long as they are within a partials folder - they will be registered and available.

## Which data/context do I get in my templates?

For now you don't get much on top of methods abi, some useful helpers and a contract name because it was enough for our use-case, but if you need something else - create a PR.
See the [type definition](https://github.com/0xProject/0x-monorepo/tree/development/packages/abi-gen/src/types.ts) of what we pass to the render method.

## Output files

Output files will be generated within an output folder with names converted to camel case and taken from abi file names. If you already have some files in that folder they will be overwritten.
