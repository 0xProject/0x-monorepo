<!--
This file is auto-generated using the monorepo-scripts package. Don't edit directly.
Edit the package's CHANGELOG.json file only.
-->

CHANGELOG

## v0.0.8 - _April 18, 2018_

    * Added support for rendering default param values (#519)
    * Added support for rendering nested function types within interface types (#519)
    * Improve type comment rendering (#535)

## v0.0.7 - _April 12, 2018_

    * Dependencies updated

## v0.0.6 - _April 2, 2018_

    * Dependencies updated

## v0.0.5 - _April 2, 2018_

    * Handle `reflection` type rendering so that anonymous function type declarations render properly (#465)
    * Rename `MethodSignature` to `Signature` and change it's props so that it can be used to render method and function signatures. (#465)
    * Rename `MethodBlock` to `SignatureBlock` since it is not used to render method and function signature blocks. (#465)
    * Add support for documenting exported functions. (#465)

## v0.0.3 - _March 18, 2018_

    * Move TS typings from devDependencies to dependencies since they are needed by the package user.

## v0.0.2 - _March 18, 2018_

    * Move example out into a separate sub-package
    * Consolidate all `console.log` calls into `logUtils` in the `@0xproject/utils` package (#452)
