## 0x-contract-artifacts

0x smart contract compilation artifacts

Read the [documentation](http://0x-contract-artifacts-py.s3-website-us-east-1.amazonaws.com/)

## Installing

```bash
pip install 0x-contract-artifacts
```

## Contributing

We welcome improvements and fixes from the wider community! To report bugs within this package, please create an issue in this repository.

Please read our [contribution guidelines](../../CONTRIBUTING.md) before getting started.

### Pull in artifacts from TypeScript build environment

```bash
./setup.py pre_install
```

### Install Code and Dependencies

```bash
pip install -e .[dev]
```

### Clean

`./setup.py clean --all`

### Lint

`./setup.py lint`

### Build Documentation

`./setup.py build_sphinx`

### More

See `./setup.py --help-commands` for more info.
