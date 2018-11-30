# 0x/sol-meta

Sol-meta is a Solidity to Solidity compiler to automatically generate testing
contracts. It does two things: exposing internal logic and stubbing/scripting
of abstract functions.

It works by generating a new contract that inherits the one under test. The
advantage of this approach is that it does not modify the code under test. The
downside is that we can not directly test contract members marked `private`.

## Usage

### Command line interface

```
Usage: sol-meta <sources> [options]

Options:
  --version    Show version number                                     [boolean]
  --help       Show help                                               [boolean]
  --config     path to config file                                      [string]
  --remapping  path remappings for import statements                     [array]
  --includes   search paths for imported source files                    [array]
  --output     directory to output too                                  [string]
  --test       run all generated mock contracts through solc           [boolean]
```

### Configuration file

Example:

```json
{
    "options": {
        "sources": ["../contracts/contracts/protocol/**/*.sol", "../contracts/contracts/utils/**/*.sol"]
    },
    "constructors": {
        "LibConstants": ["\"ZRXASSETSTRING\""]
    },
    "scripted": {
        "hashZeroExTransaction": [
            {
                "inputs": {
                    "salt": 32123,
                    "signerAddress": "0x0123123213"
                },
                "revert": "Test failed. Should never be called."
            },
            {
                "inputs": {
                    "salt": 123
                },
                "outputs": ["0x0123456"]
            }
        ]
    },
    "contracts": {
        "LibEIP712": {},
        "MixinAssetProxyDispatcher": {},
        "MixinExchangeCore": {},
        "MixinMatchOrders": {
            "constructors": {
                "LibConstants": ["\"Different string\""]
            }
        },
        "MixinSignatureValidator": {},
        "MixinTransactions": {}
    }
}
```

## Testing stategies

The two main ways sol-meta helps with testing is by exposing internals and
stubbing abstract functions. Exposing makes it possible to access otherwise
unaccesible variables and functoins from a test. Stubbing implements missing
functions for you so you can test a partial contract such as a mixin in
isolation.

### Exposing

Given an implemented contract it generates a contract that exposes all internal
functions with public wrappers.

#### Exposed Functions

All functions marked `internal` receive a public wrapper. The name of
the wrapper is `functionNamePublic`. The wrapped function signature is
identical to the original.

Private functions can not be exposed. There is currently no way to test them
directly due to the inheritance approach.

Example generated wrapper:

```solidity
    function safeAddPublic(uint256 a, uint256 b)
        public pure
        returns (uint256 result)
    {
        return safeAdd(a, bb);
    }
```

#### Exposed Modifiers

For every modifier a testing function is generated that allows you to test if
the modifier executes or not. The name of the tester function is
`modifierNameTest` and it's arguments are the arguments of the modifier. When
the modifier allows execution, it will simply return `true`.

Example generated tester:

```solidity
    function onlyAuthorizedTest(address user)
        public
        onlyAuthorized(user)
        returns (bool executed)
    {
        return true;
    }
```

#### Exposed Events

For every event, a function is created that will trigger it. The name of this
function is `EventNameEmit` and the arguments are the log event arguments.

Example generated emitter:

```solidity
    function TransferEmit(address from, address to, uint256 value)
        public
    {
        emit Transfer(from, to, value);
    }
```

#### Exposed Variables

All contract variables are given getters and setters to allow the tester to
manipulate state variables directly. The getter is named `variableNameGet`,
takes no arguments and returns the current value. The setter is named
`variableNameSet` and takes an instance of the variable type as argument.

Currently no support for maps is implemented.

Example generated getter and setter:

```solidity
    function totalSupplyGet()
        public view
        returns (uint256)
    {
        return totalSupply;
    }

    function totalSupplySet(uint256 value)
        public
    {
        totalSupply = value;
    }
```

### Scripting Functions

Any abstract function can be scripted. For this, an entry in the configuration
file is required listing inputs and outputs the stubbed function should have.
In place of an output a revert reason can be given to make the stub throw. The
list of inputs can be partial to act as a filter.

Example configuration:

```json
    "scripted": {
        "hashZeroExTransaction": [
            {
                "inputs": {
                    "salt": 123
                },
                "outputs": ["0x0123456"]
            },
            {
                "inputs": {
                    "salt": 32123,
                    "signerAddress": "0x0123123213"
                },
                "revert": "Test failed: invalid signer"
            }
        ]
    },
```

Example generate stub for above configuration:

```solidity
    function hashZeroExTransaction(
        uint256 salt,
        address signerAddress,
        bytes memory data
    )
        internal pure
        returns (bytes32 result)
    {
        if (salt == 123)
            return 0x0123456;

        if (salt == 32123 && signerAddress == 0x0123123213)
            require(false, "Test failed: invalid signer");

        require(false, "Unscripted input for hashZeroExTransaction");
    }
```

#### Stubbed Functions

For any abstract function that is not scripted, a stub is generated. Depending
on whether the function is `pure` and has return values, the behaviour is
slightly different.

For non-pure functions, the stub will log the call with all the arguments and
give the next from a sequence of responses. The responses are programmed using
a separate function. When no response is scheduled, it will revert with
`Unprogrammed input for <function name>`.

Due to usage of logs and storage, this can not be used to implement `pure`
functions. Pure functions will always revert with the reason
`Abstract function <function name> called`. Different behaviour can be
achieved with a scripted function.

There is currently an unsolved issue in the stubber where it will not detect a
public variable as implementing an abstract function. This happens for example
when `IERC20Token` requires a function `totalSupply() public returns (uint256)`
and contract contains a state variable `public uint256 totalSupply;`.

Example stub:

```solidity
    event isValidSignatureCalled(uint256 counter, bytes32 hash, address  signerAddress, bytes signature);

    struct _isValidSignature_Result {
        bool _enabled; // Should always be true
        bool _reverts; // When set, revert
        bool isValid;  // Return value
    }

    function isValidSignatureMock(uint256  _counter, _isValidSignature_Result  _value)
        public
    {
        // Schedule result number `_counter`.
    }

    function isValidSignature(bytes32 hash, address signerAddress, bytes memory signature)
        public view
        returns (bool  isValid)
    {
        // Log the inputs and return the next scheduled result.
        // ...
    }
```

#### Stubbed Actions

Example:

```solidity
    event _preSign_log(uint256  counter, bytes32  hash, address  signerAddress, bytes  signature);

    function preSign(bytes32  hash, address  signerAddress, bytes  signature)
        external
    {
        emit _preSign_log(_preSign_counter, hash, signerAddress, signature);
        _preSign_counter++;
    }
```

TODO: We need some sort of result programmability here anyway because we could
revert.

#### Stubbed Pure Functions

Example:

```solidity
    function hashZeroExTransaction(uint256  salt, address  signerAddress, bytes memory data)
        internal pure
        returns (bytes32  result)
    {
        require(false, "Abstract function hashZeroExTransaction called");
    }
```

### Constructors

A constructor is created that will call all parent constructors
that require arguments. The constructor arguments need to be supplied by config
file.

Example, the following config file:

```json
    "constructors": {
        "LibConstants": ["\"ZRXASSETSTRING\""]
    },
```

will allow sol-meta to construct contracts inheriting from `LibConstants`:

```solidity
    constructor() public
        LibConstants("ZRXASSETSTRING")
    { }
```

Note: Currently `sol-meta` assumes that all parent constructors need to be
called. If you have a contract `A is B` and `B is C` where `B` calls the
constructor of `C`, then `sol-meta` incorrectly assumes that `C` still needs to
be called.

### Non Abstract Forcer

Solidity by default does not produce any error or warning when a contract is
unintentionally abstract. Instead, output for that contract is silently ignored.
To force Solidity to error out in this case, a special contract is created that
will fail to compile if the original contract is abstract:

```solidity
contract MixinExchangeCoreMockNonAbstractForcer {
    constructor() public {
        new MixinExchangeCoreMock;
    }
}
```

## Contributing

We welcome improvements and fixes from the wider community! To report bugs
within this package, please create an issue in this repository.

Please read our [contribution guidelines](../../CONTRIBUTING.md) before getting
started.

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

To build this package and all other monorepo packages that it depends on, run
the following from the monorepo root directory:

```bash
PKG=@0xproject/sol-compiler yarn build
```

Or continuously rebuild on change:

```bash
PKG=@0xproject/sol-compiler yarn watch
```

### Clean

```bash
yarn clean
```

### Lint

```bash
yarn lint
```

### Run Tests

```bash
yarn test
```
