<!--
changelogUtils.file is auto-generated using the monorepo-scripts package. Don't edit directly.
Edit the package's CHANGELOG.json file only.
-->

CHANGELOG

## v3.1.0-beta.0 - _November 6, 2019_

    * Dependencies updated

## v3.0.1 - _April 11, 2019_

    * Dependencies updated

## v3.0.0 - _February 5, 2019_

    * Upgrade the bignumber.js to v8.0.2 (#1517)

## v2.0.2 - _January 15, 2019_

    * Dependencies updated

## v2.0.1 - _January 11, 2019_

    * Dependencies updated

## v2.0.0 - _December 13, 2018_

    * Improve async-suffix rule to check functions too, not just methods (#1425)

## v1.0.10 - _November 9, 2018_

    * Dependencies updated

## v1.0.9 - _October 18, 2018_

    * Dependencies updated

## v1.0.8 - _October 4, 2018_

    * Dependencies updated

## v1.0.7 - _September 5, 2018_

    * Dependencies updated

## v1.0.6 - _August 24, 2018_

    * Dependencies updated

## v1.0.5 - _August 14, 2018_

    * Dependencies updated

## v1.0.4 - _July 26, 2018_

    * Dependencies updated

## v1.0.3 - _July 26, 2018_

    * Dependencies updated

## v1.0.2 - _July 25, 2018_

    * Dependencies updated

## v1.0.1 - _July 23, 2018_

    * Dependencies updated

## v1.0.0 - _July 19, 2018_

    * Added a bunch of rules (#883)

## v0.4.21 - _July 9, 2018_

    * Dependencies updated

## v0.4.20 - _June 19, 2018_

    * Dependencies updated

## v0.4.19 - _May 31, 2018_

    * Incorrect publish that was unpublished

## v0.4.18 - _May 22, 2018_

    * Dependencies updated

## v0.4.17 - _May 4, 2018_

    * Dependencies updated

## v0.4.16 - _April 18, 2018_

    * Dependencies updated

## v0.4.15 - _April 11, 2018_

    * Dependencies updated

## v0.4.14 - _April 2, 2018_

    * Dependencies updated

## v0.4.13 - _April 2, 2018_

    * Dependencies updated

## v0.4.9 - _February 8, 2018_

    * Move devDeps to deps to fix missed dependency issue in published package.

## v0.4.8 - _February 8, 2018_

    * Fix publish issue where custom TSLint rules were not being included (#389)

## v0.4.7 - _February 6, 2018_

    * Modified custom 'underscore-privates' rule, changing it to 'underscore-private-and-protected' requiring underscores to be prepended to both private and protected variable names (#354)

## v0.4.0 - _December 27, 2017_

    * Added custom 'underscore-privates' rule, requiring underscores to be prepended to private variable names
    * Because our tools can be used in both a TS and JS environment, we want to make the private methods of any public facing interface show up at the bottom of auto-complete lists. Additionally, we wanted to remain consistent with respect to our usage of underscores in order to enforce this rule with a linter rule, rather then manual code reviews.

## v0.3.0 - _December 19, 2017_

    * Added rules for unused imports, variables and Async suffixes (#265)

## v0.1.0 - _November 13, 2017_

    * Re-published TsLintConfig previously published under NPM package `tslint-config-0xproject`
    * Updated to TSLint v5.8.0, requiring several rule additions to keep our conventions aligned.
