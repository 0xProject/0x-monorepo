## 0x Contribution Guide

Thank you for your interest in contributing to 0x protocol! We welcome contributions from anyone on the internet, and are grateful for even the smallest of fixes!

### How to contribute

If you'd like to contribute to 0x protocol, please fork the repo, fix, commit and send a pull request against the `development` branch for the maintainers to review and merge into the main code base. If you wish to submit more complex changes though, please check with a core dev first on [our RocketChat #dev channel](http://chat.0xproject.com) to ensure those changes are in-line with the general philosophy of the project and/or to get some early feedback which can make both your efforts easier as well as our review and merge procedures quick and simple.

We encourage a “PR early” approach so create the PR as early as possible even without the fix/feature ready, so that devs and other contributors know you have picked up the issue. These early PRs should indicate an 'in progress' status by adding the '[WIP]' prefix to the PR title. Please make sure your contributions adhere to our coding guidelines:

*   Pull requests adding features or refactoring should be opened against the `development` branch
*   Pull requests fixing bugs in the latest release version should be opened again the `master` branch
*   Write [good commit messages](https://chris.beams.io/posts/git-commit/)

### Code quality

Because 0x.js is used by multiple relayers in production and their businesses depend on it, we strive for exceptional code quality. Please follow the existing code standards and conventions. `tslint` and `prettier` (described below) will help you.

If you're adding functionality, please also add tests and make sure they pass. We have an automatic coverage reporting tool, so we'll see it if they are missing ;)
If you're adding a new public function/member, make sure you document it with Java doc-style comments. We use typedoc to generate [awesome documentation](https://0xproject.com/docs/0xjs) from the comments within our source code.

If the sub-package you are modifying has a `CHANGELOG.md` file, make sure to add an entry in it for the change made to the package. For published packages, only changes that modify the public interface or behavior of the package need a CHANGELOG entry.

#### Enabling code coverage checks on your fork

If you simply fork the repo and then create a PR sourced from it, your PR will fail its test coverage check. This is because the 0x CircleCI configuration sets the `COVERALLS_REPO_TOKEN` environment variable to the token for 0xProject/0x-monorepo, but when running the check against your fork the token needs to match the repo that is your fork, rather than the 0x repo.

To facilitate this check, after creating your fork, but before creating the branch for your PR, do the following:

1.  Log in to [coveralls.io](https://coveralls.io/), go to Add Repos, and enable your fork. Then go to the settings for that repo, and copy the Repo Token identifier.
2.  Log in to [CircleCI](https://circleci.com/login), go to Add Projects, click the Set Up Project button corresponding to your fork, and then click Start Building. (Aside from step 3 below, no actual set up is needed, since it will use the `.circleci/config.yml` file in 0x-monorepo, so you can ignore all of the instruction/explanation given on the page with the Start Building button.)
3.  In CircleCI, configure your project to add an Environment Variable, with name `COVERALLS_REPO_TOKEN`, and for the value paste in the Repo Token you copied in step 1.

Now, when you push to your branch, CircleCI will automatically run all of the checks in your own instance, and the coverage check will work since it has the proper Repo Token, and the PR will magically refer to your own checks rather than running them in the 0x CircleCI instance.

### Styleguide

We use [TSLint](https://palantir.github.io/tslint/) with [custom configs](https://github.com/0xProject/0x-monorepo/tree/development/packages/tslint-config) to keep our code style consistent.

To lint your code just run: `yarn lint`

We also use [Prettier](https://prettier.io/) to auto-format our code. Be sure to either add a [text editor integration](https://prettier.io/docs/en/editors.html) or a [pre-commit hook](https://prettier.io/docs/en/precommit.html) to properly format your code changes.

If using the Atom text editor, we recommend you install the following packages:

*   [atom-typescript](https://atom.io/packages/atom-typescript)
*   [linter-tslint](https://atom.io/packages/linter-tslint)
*   [prettier-atom](https://atom.io/packages/prettier-atom)
*   [language-ethereum](https://atom.io/packages/language-ethereum)

Our CI will also run TSLint and Prettier as a part of the test run when you submit your PR. Make sure that the CI tests pass for your contribution.

### Branch structure & versioning

We use [semantic versioning](http://semver.org/), but before a package reaches v1.0.0 all breaking changes as well as new features will be minor version bumps.

We have two main branches: `master` and `development`.

`master` represents the most recent released (published on npm) version.

`development` represents the development state and is a default branch to which you will submit a PR. We use this structure so that we can push hotfixes to the currently released version without needing to publish all the changes made towards the next release. If a hotfix is implemented on `master`, it is back-ported to `development`.
