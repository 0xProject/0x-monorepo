#### CLI Usage

```bash
$ sol-compiler
Options:
  --version        Show version number                                 [boolean]
  --contracts-dir  path of contracts directory to compile               [string]
  --artifacts-dir  path to write contracts artifacts to                 [string]
  --contracts      comma separated list of contracts to compile
                                                         [string] [default: "*"]
  --help           Show help                                           [boolean]
```

#### API Usage

```typescript
import { Compiler } from '@0x/sol-compiler';

const compiler = new Compiler();

(async () => {
    await compiler.compileAllAsync();
})().catch(console.log);
```
