## 0x-contract-wrappers

0x contract wrappers for those developing on top of 0x protocol.

Read the [documentation](http://0x-contract-wrappers-py.s3-website-us-east-1.amazonaws.com/)

## Installing

```bash
pip install 0x-contract-wrappers
```

## Contributing

We welcome improvements and fixes from the wider community! To report bugs within this package, please create an issue in this repository.

Please read our [contribution guidelines](../../CONTRIBUTING.md) before getting started.

### Install Code and Dependencies

Ensure that you have installed Python >=3.6 and Docker. Then:

```bash
pip install -e .[dev]
```

### Test

Tests depend on a running ganache instance and with the 0x contracts deployed in it. For convenience, a docker container is provided that has ganache-cli and a snapshot containing the necessary contracts. A shortcut is provided to run that docker container: `./setup.py ganache`. With that running, the tests can be run with `./setup.py test`.

### Clean

`./setup.py clean --all`

### Lint

`./setup.py lint`

### Build Documentation

`./setup.py build_sphinx`

### More

See `./setup.py --help-commands` for more info.
