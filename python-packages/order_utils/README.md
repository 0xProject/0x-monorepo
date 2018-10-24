API documentation hosted at [https://0x.readthedocs.io/projects/order-utils/en/latest/](https://0x.readthedocs.io/projects/order-utils/en/latest/)

## Development

### Edit/test cycle

`pip install -e .[dev]`

`./setup.py build`

`./setup.py build_sphinx`

`./setup.py test`

`./setup.py lint`

`./setup.py clean --all`

See `./setup.py --help-commands` for more info.

### Publishing

`./setup.py sdist bdist_wheel` will build the distribution into the `dist` folder. Once you're happy with it, you can use `./setup.py` to upload it to the package index, as described below.

If you're just experimenting, and want to try out a publish without committing to it, consider using a "staging package;" that is, rename the package, in `setup(name=...)` in `setup.py`, to something like "0x-order-utils-staging". The reason is that PyPI will never let you re-publish to an already-used file name (which includes the package name and version), even if you delete that published version from the repo. With an alternate package name, you can increase the version number (required for a successful upload) for every little experiment, without "stealing" version numbers from the main package name.

#### Uploading to test.pypi.org

Create an account at test.pypi.org (this is independent of any account at pypi.org).

With an `sdist` folder populated as described above, do `./setup.py test_publish`.

To run tests against the package deployed to test.pypi.org, run `tox -erun_tests_against_test_deployment`. If you need to run against a staging package, modify `tox.ini` to change the package name.

#### Uploading to (the real) pypi.org

Create an account at pypi.org (this is independent of any account at test.pypi.org).

With an `sdist` folder populated as described above, do `./setup.py publish`.

To run tests against the package deployed to PyPI, run `tox -erun_tests_against_deployment`. If you need to run against a staging package, modify `tox.ini` to change the package name.

#### Documentation

Documentation is hosted at readthedocs.io, and it will be automatically rebuilt upon change to the development branch. If needed, you can sign up for an account there and get yourself added to the list of Maintainers for the projects [`0x`](https://readthedocs.org/projects/0x/), [`0x-order-utils`](https://readthedocs.org/projects/0x-order-utils/), etc. You can view doc build logs, and manually trigger new builds, through the Project interface on readthedocs.io.

To have readthedocs.io build documentation from a branch, you should use a throwaway/staging Project on (eg [`0x-order-utils-staging`](https://readthedocs.org/projects/0x-order-utils-staging/), in order to avoid pushing unstable documentation onto the main project page. (If creating a new Project, be sure to copy all of the settings from the production Project's Admin, Advanced Settings menu. At the time of this writing, the only important one to copy is the Python configuration file.) In the Admin, Advanced Settings for the staging Project, set the Default Branch appropriately.
