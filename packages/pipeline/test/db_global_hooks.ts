import { setUpDbAsync, tearDownDbAsync } from './db_setup';

before('set up database', async () => {
    await setUpDbAsync();
});

after('tear down database', async () => {
    await tearDownDbAsync();
});
