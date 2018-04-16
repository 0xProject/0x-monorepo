// HACK: This dependency is optional since it is only available when run from within
// the monorepo. tslint doesn't handle optional dependencies
// tslint:disable-next-line:no-implicit-dependencies
import { runMigrationsAsync } from '@0xproject/migrations';

import { deployer } from './utils/deployer';

before('migrate contracts', async () => {
    await runMigrationsAsync(deployer);
});
