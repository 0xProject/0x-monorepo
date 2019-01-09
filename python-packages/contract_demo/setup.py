#!/usr/bin/env python

"""setuptools module for 0x-contract-demo package."""

import distutils.command.build_py
from distutils.command.clean import clean
import subprocess  # nosec
from shutil import rmtree
from os import environ, path
from sys import argv

from setuptools import setup
from setuptools.command.test import test as TestCommand


class TestCommandExtension(TestCommand):
    """Run pytest tests."""

    def run_tests(self):
        """Invoke pytest."""
        import pytest

        exit(pytest.main())


class LintCommand(distutils.command.build_py.build_py):
    """Custom setuptools command class for running linters."""

    description = "Run linters"

    def run(self):
        """Run linter shell commands."""
        lint_commands = [
            # formatter:
            "black --line-length 79 --check --diff test setup.py".split(),
            # style guide checker (formerly pep8):
            "pycodestyle test setup.py".split(),
            # docstring style checker:
            "pydocstyle test setup.py".split(),
            # static type checker:
            "mypy test setup.py".split(),
            # security issue checker:
            "bandit -r ./setup.py".split(),
            # general linter:
            "pylint test setup.py".split(),
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
        rmtree(".mypy_cache", ignore_errors=True)
        rmtree(".tox", ignore_errors=True)
        rmtree(".pytest_cache", ignore_errors=True)


class GanacheCommand(distutils.command.build_py.build_py):
    """Custom command to publish to pypi.org."""

    description = "Run ganache daemon to support tests."

    def run(self):
        """Run ganache."""
        cmd_line = "docker run -d -p 8545:8545 0xorg/ganache-cli:2.2.2".split()
        subprocess.call(cmd_line)  # nosec


class PublishDocsCommand(distutils.command.build_py.build_py):
    """Custom command to publish docs to S3."""

    description = (
        "Publish docs to "
        + "http://0x-contract-addresses-py.s3-website-us-east-1.amazonaws.com/"
    )

    def run(self):
        """Run npm package `discharge` to build & upload docs."""
        subprocess.check_call("discharge deploy".split())  # nosec


setup(
    name="0x-contract-demo",
    version="1.0.0",
    description="Demonstration of calling 0x contracts",
    url=(
        "https://github.com/0xProject/0x-monorepo/tree/development"
        + "/python-packages/contract_demo"
    ),
    author="F. Eugene Aumson",
    author_email="feuGeneA@users.noreply.github.com",
    cmdclass={
        "clean": CleanCommandExtension,
        "lint": LintCommand,
        "test": TestCommandExtension,
        "ganache": GanacheCommand,
        "publish_docs": PublishDocsCommand,
    },
    install_requires=[
        "0x-contract-addresses",
        "0x-contract-artifacts",
        "0x-order-utils",
        "0x-web3",  # TEMPORARY! pending resolution of our web3.py PR#1147
        "mypy_extensions",
    ],
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
        ]
    },
    python_requires=">=3.6, <4",
    license="Apache 2.0",
    zip_safe=False,  # required per mypy
    command_options={
        "build_sphinx": {
            "source_dir": ("setup.py", "test"),
            "build_dir": ("setup.py", "build/docs"),
        }
    },
)
