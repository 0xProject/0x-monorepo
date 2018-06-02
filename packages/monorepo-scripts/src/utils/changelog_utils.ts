import * as _ from 'lodash';
import * as moment from 'moment';

import { Change, Changelog, VersionChangelog } from '../types';

const CHANGELOG_MD_HEADER = `
<!--
This file is auto-generated using the monorepo-scripts package. Don't edit directly.
Edit the package's CHANGELOG.json file only.
-->

CHANGELOG
`;

export const changelogUtils = {
    getChangelogMdTitle(versionChangelog: VersionChangelog): string {
        if (_.isUndefined(versionChangelog.timestamp)) {
            throw new Error(
                'All CHANGELOG.json entries must be updated to include a timestamp before generating their MD version',
            );
        }
        const date = moment(`${versionChangelog.timestamp}`, 'X').format('MMMM D, YYYY');
        const title = `\n## v${versionChangelog.version} - _${date}_\n\n`;
        return title;
    },
    getChangelogMdChange(change: Change): string {
        let line = `    * ${change.note}`;
        if (!_.isUndefined(change.pr)) {
            line += ` (#${change.pr})`;
        }
        return line;
    },
    generateChangelogMd(changelog: Changelog): string {
        let changelogMd = CHANGELOG_MD_HEADER;
        _.each(changelog, versionChangelog => {
            const title = changelogUtils.getChangelogMdTitle(versionChangelog);
            changelogMd += title;
            const changelogVersionLines = _.map(
                versionChangelog.changes,
                changelogUtils.getChangelogMdChange.bind(changelogUtils),
            );
            changelogMd += `${_.join(changelogVersionLines, '\n')}`;
        });

        return changelogMd;
    },
    shouldAddNewChangelogEntry(currentVersion: string, changelog: Changelog): boolean {
        if (_.isEmpty(changelog)) {
            return true;
        }
        const lastEntry = changelog[0];
        const isLastEntryCurrentVersion = lastEntry.version === currentVersion;
        return isLastEntryCurrentVersion;
    },
};
