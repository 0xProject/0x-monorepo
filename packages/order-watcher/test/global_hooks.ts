import { runMigrationsAsync } from '@0xproject/migrations';

import { deployer } from './utils/deployer';

before('migrate contracts', async () => {
    await runMigrationsAsync(deployer);
});
