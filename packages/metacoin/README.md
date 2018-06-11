## @0xproject/metacoin

This is a small example project that server as a showroom/polygon for 0x dev tools.
It suppports:

*   Compiling & testing smart contracts
*   Typed contract wrappers
*   Coverage
*   Profiling
*   Running tests against Ganache
*   Running tests against our fork of Geth that supports snapshots & time travel

## Contributing

We welcome improvements and fixes from the wider community! To report bugs within this package, please create an issue in this repository.

Please read our [contribution guidelines](../../CONTRIBUTING.md) before getting started.

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

To build this package and all other monorepo packages that it depends on, run the following from the monorepo root directory:

```bash
PKG=@0xproject/metacoin yarn build
```

Or continuously rebuild on change:

```bash
PKG=@0xproject/metacoin yarn watch
```

### Clean

```bash
yarn clean
```

### Lint

```bash
yarn lint
```

### Test providers

By default tests run against an in-process Ganache instance. If you want to use Geth you'll need to [start a Geth dev node](https://github.com/0xProject/0x-monorepo/blob/v2-prototype/packages/devnet/README.md) first.

```bash
cd ../devnet
docker build -t 0x-devnet .
docker run -it --rm -p 8501:8501 0x-devnet
```

This Geth version supports snapshots and time travel. Then - run your tests against it.

```
TEST_PROVIDER=geth yarn test
```

### Coverage

```bash
yarn test:coverage
yarn coverage:report:html
```

### Profiling

Please note that traces emmited by ganache have incorrect gas costs so we recommend using Geth for profiling.

```bash
TEST_PROVIDER=geth yarn test:profile
```

You'll see a warning that you need to explicitly enable and disable the profiler before and after the block of code you want to profile.

```typescript
import { profiler } from './utils/profiler';
profiler.start();
// Some solidity stuff
profiler.stop();
```
