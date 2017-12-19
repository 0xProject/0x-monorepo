@0xproject/utils
------

Utils to be shared across 0x projects and packages

## Installation

```bash
yarn add @0xproject/utils
```

## Usage

```javascript
import {
    addressUtils, 
    bigNumberConfigs,
    classUtils,
    intervalUtils,
    promisify,
} from '@0xproject/utils';
```

## Contributing

We strongly encourage our community members to help us make improvements and to determine the future direction of the protocol. To report bugs within this package, please create an issue in this repository. 

[CONTRIBUTING.md](../../CONTRIBUTING.md)

### Install Dependencies

If you don't have yarn workspaces enabled - enable them:
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

### Run Tests

N/A
