# CHANGELOG

## v0.5.0 - _TBD, 2018_

    * Modified custom 'underscore-privates' rule, changing it to 'underscore-private-and-protected' requiring underscores to be prepended to both private and protected variable names

## v0.4.0 - _December 28, 2017_

    * Added custom 'underscore-privates' rule, requiring underscores to be prepended to private variable names
    * Because our tools can be used in both a TS and JS environment, we want to make the private methods of any public facing interface show up at the bottom of auto-complete lists. Additionally, we wanted to remain consistent with respect to our usage of underscores in order to enforce this rule with a linter rule, rather then manual code reviews.

## v0.3.0 - _December 20, 2017_

    * Added rules for unused imports, variables and Async suffixes (#265)

## v0.1.0 - _Nov. 14, 2017_

    * Re-published TsLintConfig previously published under NPM package `tslint-config-0xproject`
    * Updated to TSLint v5.8.0, requiring several rule additions to keep our conventions aligned.
