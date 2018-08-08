import * as promisify from 'es6-promisify';
import * as publishRelease from 'publish-release';

import { utils } from './utils/utils';
import { publishReleaseNotesAsync } from './utils/github_release_utils';

(async () => {
    const shouldIncludePrivate = false;
    const allUpdatedPackages = await utils.getUpdatedPackagesAsync(shouldIncludePrivate);

    await publishReleaseNotesAsync(allUpdatedPackages);
})();
