#!/usr/bin/env python
# coding: utf-8

"""setuptools module for sra_client package."""

import subprocess  # nosec
import distutils.command.build_py
from urllib.request import urlopen
from urllib.error import URLError

from setuptools import setup, find_packages  # noqa: H301
from setuptools.command.test import test as TestCommand

NAME = "0x-sra-client"
VERSION = "2.0.0"
# To install the library, run the following
#
# python setup.py install
#
# prerequisite: setuptools
# http://pypi.python.org/pypi/setuptools

with open("README.md", "r") as file_handle:
    README_MD = file_handle.read()

REQUIRES = ["urllib3 >= 1.15", "six >= 1.10", "certifi", "python-dateutil"]


class TestCommandExtension(TestCommand):
    """Run pytest tests."""

    def run_tests(self):
        """Invoke pytest."""
        import pytest

        exit(pytest.main(["--doctest-modules", "-rapP"]))
        #        show short test summary at end ^


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


class StartTestRelayerCommand(distutils.command.build_py.build_py):
    """Custom command to boot up a local 0x-launch-kit-backend in docker."""

    description = "Run launch-kit daemon to support tests."

    def run(self):
        """Run `docker-compose up`."""
        subprocess.call(  # nosec
            ("docker-compose -f test/relayer/docker-compose.yml up -d").split()
        )
        launch_kit_ready = False
        print("Waiting for relayer to start accepting connections...", end="")
        while not launch_kit_ready:
            try:
                launch_kit_ready = (
                    urlopen(  # nosec
                        "http://localhost:3000/v2/asset_pairs"
                    ).getcode()
                    == 200
                )
            except URLError:
                continue
        print("done")


class StopTestRelayerCommand(distutils.command.build_py.build_py):
    """Custom command to tear down the 0x-launch-kit-backend test relayer."""

    description = "Tear down launch-kit daemon."

    def run(self):
        """Run `docker-compose down`."""
        subprocess.call(  # nosec
            ("docker-compose -f test/relayer/docker-compose.yml down").split()
        )


class LintCommand(distutils.command.build_py.build_py):
    """Custom setuptools command class for running linters."""

    description = "Run linters"

    def run(self):
        """Run linter shell commands."""
        lint_targets = "test src/zero_ex/sra_client/__init__.py setup.py"
        lint_commands = [
            # formatter:
            (
                f"black --line-length 79 --check --diff test {lint_targets}"
            ).split(),
            # style guide checker (formerly pep8):
            f"pycodestyle {lint_targets}".split(),
            # docstring style checker:
            f"pydocstyle {lint_targets}".split(),
            # static type checker:
            f"bandit -r {lint_targets}".split(),
            # general linter:
            f"pylint {lint_targets}".split(),
            # pylint takes relatively long to run, so it runs last, to enable
            # fast failures.
        ]

        for lint_command in lint_commands:
            print(
                "Running lint command `", " ".join(lint_command).strip(), "`"
            )
            subprocess.check_call(lint_command)  # nosec


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
        + "http://0x-sra-client-py.s3-website-us-east-1.amazonaws.com/"
    )

    def run(self):
        """Run npm package `discharge` to build & upload docs."""
        subprocess.check_call("discharge deploy".split())  # nosec


setup(
    name=NAME,
    version=VERSION,
    description="Standard Relayer REST API Client",
    author_email="",
    url=(
        "https://github.com/0xproject/0x-monorepo/tree/development"
        "/python-packages/sra_client"
    ),
    keywords=["OpenAPI", "OpenAPI-Generator", "Standard Relayer REST API"],
    install_requires=REQUIRES,
    namespace_packages=["zero_ex"],
    packages=find_packages("src"),
    package_dir={"": "src"},
    include_package_data=True,
    long_description=README_MD,
    long_description_content_type="text/markdown",
    cmdclass={
        "test_publish": TestPublishCommand,
        "publish": PublishCommand,
        "start_test_relayer": StartTestRelayerCommand,
        "stop_test_relayer": StopTestRelayerCommand,
        "lint": LintCommand,
        "publish_docs": PublishDocsCommand,
        "test": TestCommandExtension,
    },
    extras_require={
        "dev": [
            "0x-contract-artifacts",
            "0x-contract-addresses",
            "0x-order-utils",
            "web3",
            "bandit",
            "black",
            "coverage",
            "coveralls",
            "pycodestyle",
            "pydocstyle",
            "pylint",
            "pytest",
            "sphinx",
            "sphinx-autodoc-typehints",
        ]
    },
    command_options={
        "build_sphinx": {
            "source_dir": ("setup.py", "src"),
            "build_dir": ("setup.py", "build/docs"),
            "warning_is_error": ("setup.py", "true"),
        }
    },
)
