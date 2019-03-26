#!/usr/bin/env python
# coding: utf-8

"""setuptools module for sra_client package."""

import subprocess  # nosec
import distutils.command.build_py

from setuptools import setup, find_packages  # noqa: H301
from setuptools.command.test import test as TestCommand

NAME = "0x-sra-client"
VERSION = "1.0.1"
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

        exit(pytest.main(["--doctest-modules"]))


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


class GanacheCommand(distutils.command.build_py.build_py):
    """Custom command to publish to pypi.org."""

    description = "Run ganache daemon to support tests."

    def run(self):
        """Run ganache."""
        cmd_line = (
            "docker run -d -p 8545:8545 0xorg/ganache-cli:2.2.2"
        ).split()
        subprocess.call(cmd_line)  # nosec


class LaunchKitCommand(distutils.command.build_py.build_py):
    """Custom command to boot up a local 0x-launch-kit in docker."""

    description = "Run launch-kit daemon to support sra_client demos."

    def run(self):
        """Run 0x-launch-kit."""
        cmd_line = ("docker run -d -p 3000:3000 0xorg/launch-kit-ci").split()
        subprocess.call(cmd_line)  # nosec


class LintCommand(distutils.command.build_py.build_py):
    """Custom setuptools command class for running linters."""

    description = "Run linters"

    def run(self):
        """Run linter shell commands."""
        lint_commands = [
            # formatter:
            "black --line-length 79 --check --diff test sra_client/__init__.py setup.py".split(),  # noqa: E501 (line too long)
            # style guide checker (formerly pep8):
            "pycodestyle test sra_client/__init__.py setup.py".split(),
            # docstring style checker:
            "pydocstyle src test sra_client/__init__.py setup.py".split(),
            # static type checker:
            "bandit -r test sra_client/__init__.py setup.py".split(),
            # general linter:
            "pylint test sra_client/__init__.py setup.py".split(),
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
        + "http://0x-sra-demos-py.s3-website-us-east-1.amazonaws.com/"
    )

    def run(self):
        """Run npm package `discharge` to build & upload docs."""
        subprocess.check_call("discharge deploy".split())  # nosec


setup(
    name=NAME,
    version=VERSION,
    description="Standard Relayer REST API",
    author_email="",
    url="https://github.com/0xproject/0x-monorepo/python-packages/sra_client",
    keywords=["OpenAPI", "OpenAPI-Generator", "Standard Relayer REST API"],
    install_requires=REQUIRES,
    packages=find_packages(),
    include_package_data=True,
    long_description=README_MD,
    long_description_content_type="text/markdown",
    cmdclass={
        "test_publish": TestPublishCommand,
        "publish": PublishCommand,
        "launch_kit": LaunchKitCommand,
        "lint": LintCommand,
        "publish_docs": PublishDocsCommand,
        "test": TestCommandExtension,
        "ganache": GanacheCommand,
    },
    extras_require={
        "dev": [
            "0x-contract-artifacts",
            "0x-contract-addresses",
            "0x-order-utils",
            "0x-web3",
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
            "source_dir": ("setup.py", "."),
            "build_dir": ("setup.py", "build/docs"),
        }
    },
)
