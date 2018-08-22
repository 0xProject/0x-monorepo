import { publishReleaseNotesAsync } from './utils/github_release_utils';
import { utils } from './utils/utils';

// tslint:disable-next-line:no-floating-promises
(async () => {
    const shouldIncludePrivate = false;
    const allUpdatedPackages = await utils.getUpdatedPackagesAsync(shouldIncludePrivate);

    await publishReleaseNotesAsync(allUpdatedPackages);
})();
