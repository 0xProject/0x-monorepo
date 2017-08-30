# 0x.js CONTRIBUTING.md

Thank you for your interest in contributing to 0x.js! We welcome contributions from anyone on the internet, and are grateful for even the smallest of fixes!

## Developer's guide

## How to contribute

If you'd like to contribute to 0x.js, please fork the repo, fix, commit and send a pull request against the `development` branch for the maintainers to review and merge into the main code base. If you wish to submit more complex changes though, please check up with a core dev first on [our gitter channel](https://gitter.im/0xProject/Lobby) or  in the `#dev` channel on our [slack](https://slack.0xproject.com/) to ensure those changes are in line with the general philosophy of the project and/or to get some early feedback which can make both your efforts easier as well as our review and merge procedures quick and simple.

We encourage a “PR early” approach so create the PR as early as possible even without the fix/feature ready, so that devs and other volunteers know you have picked up the issue. These early PRs should indicate an 'in progress' status by adding the '[WIP]' prefix to the PR title. Please make sure your contributions adhere to our coding guidelines:

* Pull requests adding features or refactoring should be opened against the `development` branch
* Pull requests fixing bugs in the latest release version should be opened again the `master` branch
* Write [good commit messages](https://chris.beams.io/posts/git-commit/)

## Code quality

Because 0x.js is used by multiple relayers in production and their businesses depend on it, we strive for excellent code quality. Please follow the existing code standards and conventions. `tslint` (described below) will help you.
If you're adding functionality, please also add tests and make sure they pass. We have an automatic coverage reporting tool, so we'll see it if they are missing ;)
If you're adding a new public function/member, make sure you document it with Java doc-style comments. We use typedoc to generate [awesome documentation](https://0xproject.com/docs/0xjs) from the comments within our source code.

## Running and building

First thing to do with an unknown code base is to run the tests.
We assume that you have `npm` and `yarn` installed.

To do that:

* Install dependencies: `yarn`
* Initialize the testrpc state (migrate the contracts) by doing one of the following:
    * Manual contracts migration:
        * Run testrpc: `yarn testrpc`
        * Clone the `[contracts](https://github.com/0xProject/contracts)` repo and run `yarn migrate`
    * Use one of the existing testrpc snapshots
        * Check out `circle.yml` for an example
* Run tests: `yarn test`

To build run: `yarn build`

We also recommend you read through the tests.

## Styleguide

We use `[tslint](https://palantir.github.io/tslint/)` with [custom configs](https://github.com/0xProject/tslint-config-0xproject) to keep our code style consistent.

To lint your code just run: `yarn lint`

If using the Atom text editor, we recommend you install the following packages:

* [atom-typescript](https://atom.io/packages/atom-typescript)
* [linter-tslint](https://atom.io/packages/linter-tslint)

Our CI will also run it as a part of the test run when you submit your PR.


## Branch structure & versioning

We use [semantic versioning](http://semver.org/), but before we reach v1.0.0 all breaking changes as well as new features will be minor version bumps.

We have two main branches: `master` and `development`.

`master` represents the most recent released (published on npm) version.

`development` represents the development state and is a default branch to which you will submit a PR. We use this structure so that we can push hotfixes to the currently released version without needing to publish all the changes made towards the next release. If a hotfix is implemented on `master`, it is back-ported to `development`.
