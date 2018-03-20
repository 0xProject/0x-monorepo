# CHANGELOG

## v0.0.3 - _March 18, 2018_

    * Move TS typings from devDependencies to dependencies since they are needed by the package user.

## v0.0.2 - _March 18, 2018_

    * Move example out into a separate sub-package
    * Consolidate all `console.log` calls into `logUtils` in the `@0xproject/utils` package (#452)
    * Handle `reflection` type rendering so that anonymous function type declarations render properly
    * Rename `MethodSignature` to `Signature` and change it's props so that it can be used to render method and function signatures.
    * Rename `MethodBlock` to `SignatureBlock` since it is not used to render method and function signature blocks.
    * Add support for documenting exported functions.
