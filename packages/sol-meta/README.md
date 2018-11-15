## 0x/sol-meta

Sol-meta is a Solidity to Solidity compiler to automatically generate testing
contracts. It does a number of things: exposing internal logic, stubbing
abstract functions, scripting abstract functions.

### Exposing

Given an implemented contract it generates a contract that exposes all internal
functions with public wrappers.

#### Exposed Functions

All internal functions receive a public wrapper.

Example:

```solidity
    function safeAddPublic(uint256 a, uint256 b)
        public pure
        returns (uint256 result)
    {
        return safeAdd(a, bb);
    }
```

#### Exposed Modifiers

For every modifier a testing function is generated.

Example:

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

For every event, a function is created that will trigger it.

Example:

```solidity
    function TransferEmit(address from, address to, uint256 value)
        public
    {
        emit Transfer(from, to, value);
    }
```

#### Exposed Variables

All variable are given getters and setters.

Example:

```solidity
    function totalSupplyGet()
        public
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

Limitations:

Currently no support for maps is implemented.

### Scripting Functions

Example:

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
                "reverts": "Test failed. Should never be called."
            }
        ]
    },
```

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
            require(false, "Test failed. Should never be called.");

        require(false, "Unscripted input for hashZeroExTransaction");
    }
```

### Stubbing

Given an interface contract (either a public interface or a mixin), it can
generate a mock implementation.

Note: the computation of what is abstract and what is not is imperfect. In
particular, public variables imply getter functions.

#### Stubbed Functions

Example:

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
        // Log the inputs and return the next schedult result.
        // ...
    }
```

When there is no enabled option, it will revert with the message `Unprogrammed input for isValidSignature`.

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

```json
    "constructors": {
        "LibConstants": ["\"ZRXASSETSTRING\""]
    },
```

Example:

```solidity
    constructor() public
        LibConstants("ZRXASSETSTRING")
    { }
```

Note: Constructors calling parent constructors is not taken into consideration.
These will incorrectly appear as to-be-call.

### Non Abstract Forcer

Solidity by default does not produce any error or warning when a contract is
unintentionally abstract. Instead, output for that contract is silently ignored.
To force Solidity to error out in this case, a special contract is created that
will fail to compile if the original contract is abstract:

```solidity
contract MixinExchangeCoreMockNonAbstractForcer {
    constructor() {
        new MixinExchangeCoreMock;
    }
}
```

## Command line interface

```
Usage: sol-meta.js <sources> [options]

Options:
  --version    Show version number                                     [boolean]
  --help       Show help                                               [boolean]
  --config     config file                                              [string]
  --remapping  path remappings for import statements                     [array]
  --includes   search paths for imported source files                    [array]
  --output     directory to output too                                  [string]
  --test       run all generated mock contracts through solc           [boolean]
```

## Configuration file

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
