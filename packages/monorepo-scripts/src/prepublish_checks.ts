import * as _ from 'lodash';
import { exec as execAsync } from 'promisify-child-process';

import { constants } from './constants';
import { utils } from './utils/utils';

async function checkPublishRequiredSetupAsync(): Promise<void> {
    // check to see if logged into npm before publishing
    try {
        // HACK: for some reason on some setups, the `npm whoami` will not recognize a logged-in user
        // unless run with `sudo` (i.e Fabio's NVM setup) but is fine for others (Jacob's NVM setup).
        utils.log('Checking that the user is logged in on npm...');
        await execAsync(`sudo npm whoami`);
    } catch (err) {
        throw new Error('You must be logged into npm in the commandline to publish. Run `npm login` and try again.');
    }

    // Check to see if Git personal token setup
    if (_.isUndefined(constants.githubPersonalAccessToken)) {
        throw new Error(
            'You must have a Github personal access token set to an envVar named `GITHUB_PERSONAL_ACCESS_TOKEN_0X_JS`. Add it then try again.',
        );
    }

    // Check Yarn version is 1.X
    utils.log('Checking the yarn version...');
    const result = await execAsync(`yarn --version`);
    const version = result.stdout;
    const versionSegments = version.split('.');
    const majorVersion = _.parseInt(versionSegments[0]);
    if (majorVersion < 1) {
        throw new Error('Your yarn version must be v1.x or higher. Upgrade yarn and try again.');
    }

    // Check that `aws` commandline tool is installed
    try {
        utils.log('Checking that aws CLI tool is installed...');
        await execAsync(`aws help`);
    } catch (err) {
        throw new Error('You must have `awscli` commandline tool installed. Install it and try again.');
    }

    // Check that `aws` credentials are setup
    try {
        utils.log('Checking that aws credentials are configured...');
        await execAsync(`aws sts get-caller-identity`);
    } catch (err) {
        throw new Error('You must setup your AWS credentials by running `aws configure`. Do this and try again.');
    }
}

checkPublishRequiredSetupAsync().catch(err => {
    utils.log(err);
    process.exit(1);
});
