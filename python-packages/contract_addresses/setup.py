#!/usr/bin/env python

"""setuptools module for contract_addresses package."""

# pylint: disable=import-outside-toplevel
# we import things outside of top-level because 3rd party libs may not yet be
# installed when you invoke this script

import subprocess  # nosec
from shutil import copyfile, rmtree
from os import environ, path, remove
from sys import argv, exit  # pylint: disable=redefined-builtin

from distutils.command.clean import clean
import distutils.command.build_py
from setuptools import find_packages, setup
from setuptools.command.test import test as TestCommand


class PreInstallCommand(distutils.command.build_py.build_py):
    """Custom setuptools command class for pulling in addresses.json."""

    description = (
        "Pull in addresses.json from ../../packages/contract-addresses"
    )

    def run(self):
        """Copy over addresses.json."""
        pkgdir = path.dirname(path.realpath(argv[0]))

        destination_path = path.join(
            pkgdir, "src", "zero_ex", "contract_addresses"
        )

        try:
            remove(path.join(destination_path, "addresses.json"))
        except FileNotFoundError:
            pass
        copyfile(
            path.join(
                pkgdir,
                "..",
                "..",
                "packages",
                "contract-addresses",
                "addresses.json",
            ),
            path.join(destination_path, "addresses.json"),
        )


class LintCommand(distutils.command.build_py.build_py):
    """Custom setuptools command class for running linters."""

    description = "Run linters"

    def run(self):
        """Run linter shell commands."""
        lint_commands = [
            # formatter:
            "black --line-length 79 --check --diff src setup.py".split(),
            # style guide checker (formerly pep8):
            "pycodestyle --show-source --show-pep8 src setup.py".split(),
            # docstring style checker:
            "pydocstyle src setup.py".split(),
            # static type checker:
            "mypy src setup.py".split(),
            # security issue checker:
            "bandit -r src ./setup.py".split(),
            # general linter:
            "pylint src setup.py".split(),
            # pylint takes relatively long to run, so it runs last, to enable
            # fast failures.
        ]

        # tell mypy where to find interface stubs for 3rd party libs
        environ["MYPYPATH"] = path.join(
            path.dirname(path.realpath(argv[0])), "stubs"
        )

        for lint_command in lint_commands:
            print(
                "Running lint command `", " ".join(lint_command).strip(), "`"
            )
            subprocess.check_call(lint_command)  # nosec


class CleanCommandExtension(clean):
    """Custom command to do custom cleanup."""

    def run(self):
        """Run the regular clean, followed by our custom commands."""
        super().run()
        rmtree("dist", ignore_errors=True)
        rmtree(".mypy_cache", ignore_errors=True)
        rmtree(".tox", ignore_errors=True)
        rmtree(".pytest_cache", ignore_errors=True)
        rmtree("src/0x_contract_addresses.egg-info", ignore_errors=True)


class TestPublishCommand(distutils.command.build_py.build_py):
    """Custom command to publish to test.pypi.org."""

    description = (
        "Publish dist/* to test.pypi.org. Run sdist & bdist_wheel first."
    )

    def run(self):
        """Run twine to upload to test.pypi.org."""
        subprocess.check_call(  # nosec
            (
                "twine upload --repository-url https://test.pypi.org/legacy/"
                + " --verbose dist/*"
            ).split()
        )


class PublishCommand(distutils.command.build_py.build_py):
    """Custom command to publish to pypi.org."""

    description = "Publish dist/* to pypi.org. Run sdist & bdist_wheel first."

    def run(self):
        """Run twine to upload to pypi.org."""
        subprocess.check_call("twine upload dist/*".split())  # nosec


class PublishDocsCommand(distutils.command.build_py.build_py):
    """Custom command to publish docs to S3."""

    description = (
        "Publish docs to "
        + "http://0x-contract-addresses-py.s3-website-us-east-1.amazonaws.com/"
    )

    def run(self):
        """Run npm package `discharge` to build & upload docs."""
        subprocess.check_call("discharge deploy".split())  # nosec


class TestCommandExtension(TestCommand):
    """Run pytest tests."""

    def run_tests(self):
        """Invoke pytest."""
        import pytest

        exit(pytest.main(["--doctest-modules", "-rapP"]))
        #        show short test summary at end ^


with open("README.md", "r") as file_handle:
    README_MD = file_handle.read()


setup(
    name="0x-contract-addresses",
    version="2.2.0",
    description="Addresses at which the 0x smart contracts have been deployed",
    long_description=README_MD,
    long_description_content_type="text/markdown",
    url=(
        "https://github.com/0xproject/0x-monorepo/tree/development"
        + "/python-packages/contract_addresses"
    ),
    author="F. Eugene Aumson",
    author_email="feuGeneA@users.noreply.github.com",
    cmdclass={
        "clean": CleanCommandExtension,
        "pre_install": PreInstallCommand,
        "lint": LintCommand,
        "test": TestCommandExtension,
        "test_publish": TestPublishCommand,
        "publish": PublishCommand,
        "publish_docs": PublishDocsCommand,
    },
    install_requires=["mypy_extensions"],
    extras_require={
        "dev": [
            "bandit",
            "black",
            "coverage",
            "coveralls",
            "mypy",
            "mypy_extensions",
            "pycodestyle",
            "pydocstyle",
            "pylint",
            "pytest",
            "sphinx",
            "tox",
            "twine",
        ]
    },
    python_requires=">=3.6, <4",
    package_data={
        "zero_ex.contract_addresses": ["py.typed", "addresses.json"]
    },
    package_dir={"": "src"},
    license="Apache 2.0",
    keywords=(
        "ethereum cryptocurrency 0x decentralized blockchain dex exchange"
    ),
    namespace_packages=["zero_ex"],
    packages=find_packages("src"),
    classifiers=[
        "Development Status :: 5 - Production/Stable",
        "Intended Audience :: Developers",
        "Intended Audience :: Financial and Insurance Industry",
        "License :: OSI Approved :: Apache Software License",
        "Natural Language :: English",
        "Operating System :: OS Independent",
        "Programming Language :: Python",
        "Programming Language :: Python :: 3 :: Only",
        "Programming Language :: Python :: 3.6",
        "Programming Language :: Python :: 3.7",
        "Topic :: Internet :: WWW/HTTP",
        "Topic :: Office/Business :: Financial",
        "Topic :: Other/Nonlisted Topic",
        "Topic :: Security :: Cryptography",
        "Topic :: Software Development :: Libraries",
        "Topic :: Utilities",
    ],
    zip_safe=False,  # required per mypy
    command_options={
        "build_sphinx": {
            "source_dir": ("setup.py", "src"),
            "build_dir": ("setup.py", "build/docs"),
            "warning_is_error": ("setup.py", "true"),
        }
    },
)
