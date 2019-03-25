## 0x-sra-demos

Demonstrations of using the python 0x Standard Relayer API client.

Read the [documentation](http://0x-demos-py.s3-website-us-east-1.amazonaws.com/)

## Contributing

We welcome improvements and fixes from the wider community! To report bugs within this package, please create an issue in this repository.

Please read our [contribution guidelines](../../CONTRIBUTING.md) before getting started.

### Install Code and Dependencies

Ensure that you have installed Python >=3.6 and Docker. Then:

```bash
pip install -e .[dev]
```

### Test

Tests depend on a running relayer instance that implements the 0x Standard Relayer API. For convenience, a docker container is provided that has the 0x-launch-kit server. A shortcut is provided to run that docker container: `./setup.py launch_kit`. With that running, the tests can be run with `./setup.py test`.

### Clean

`./setup.py clean --all`

### Lint

`./setup.py lint`

### Build Documentation

`./setup.py build_sphinx`

### More

See `./setup.py --help-commands` for more info.
