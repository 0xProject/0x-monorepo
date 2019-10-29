#!/usr/bin/env python

"""setuptools module for middlewares package."""

# pylint: disable=import-outside-toplevel
# we import things outside of top-level because 3rd party libs may not yet be
# installed when you invoke this script

import subprocess  # nosec
from shutil import rmtree
from os import environ, path
from sys import argv, exit  # pylint: disable=redefined-builtin

from distutils.command.clean import clean
import distutils.command.build_py
from setuptools import find_packages, setup
from setuptools.command.test import test as TestCommand


class TestCommandExtension(TestCommand):
    """Run pytest tests."""

    def run_tests(self):
        """Invoke pytest."""
        import pytest

        exit(pytest.main(["--doctest-modules", "-rapP"]))
        #        show short test summary at end ^


class LintCommand(distutils.command.build_py.build_py):
    """Custom setuptools command class for running linters."""

    description = "Run linters"

    def run(self):
        """Run linter shell commands."""
        lint_commands = [
            # formatter:
            "black --line-length 79 --check --diff src test setup.py".split(),
            # style guide checker (formerly pep8):
            "pycodestyle src test setup.py".split(),
            # docstring style checker:
            "pydocstyle src test setup.py".split(),
            # static type checker:
            "mypy src test setup.py".split(),
            # security issue checker:
            "bandit -r src ./setup.py".split(),
            # general linter:
            "pylint src test setup.py".split(),
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
        rmtree("src/0x_middlewares.egg-info", ignore_errors=True)


class TestPublishCommand(distutils.command.build_py.build_py):
    """Custom command to publish to test.pypi.org."""

    description = (
        "Publish dist/* to test.pypi.org." "Run sdist & bdist_wheel first."
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
        + "http://0x-middlewares-py.s3-website-us-east-1.amazonaws.com/"
    )

    def run(self):
        """Run npm package `discharge` to build & upload docs."""
        subprocess.check_call("discharge deploy".split())  # nosec


class GanacheCommand(distutils.command.build_py.build_py):
    """Custom command to publish to pypi.org."""

    description = "Run ganache daemon to support tests."

    def run(self):
        """Run ganache."""
        cmd_line = (
            "docker run -d -p 8545:8545 0xorg/ganache-cli:2.2.2"
        ).split()
        subprocess.call(cmd_line)  # nosec


with open("README.md", "r") as file_handle:
    README_MD = file_handle.read()


setup(
    name="0x-middlewares",
    version="1.0.0.dev0",
    description="Web3 middlewares for 0x applications",
    long_description=README_MD,
    long_description_content_type="text/markdown",
    url=(
        "https://github.com/0xproject/0x-monorepo/tree/development"
        "/python-packages/middlewares"
    ),
    author="Michael Huang",
    author_email="michaelhly@users.noreply.github.com",
    cmdclass={
        "clean": CleanCommandExtension,
        "lint": LintCommand,
        "test": TestCommandExtension,
        "test_publish": TestPublishCommand,
        "publish": PublishCommand,
        "publish_docs": PublishDocsCommand,
        "ganache": GanacheCommand,
    },
    install_requires=[
        "eth-account",
        "eth-keys",
        "hexbytes",
        "mypy_extensions",
    ],
    extras_require={
        "dev": [
            "0x-contract-addresses",
            "0x-contract-wrappers",
            "0x-order-utils",
            "web3",
            "bandit",
            "black",
            "coverage",
            "coveralls",
            "eth_utils",
            "mypy",
            "mypy_extensions",
            "pycodestyle",
            "pydocstyle",
            "pylint",
            "pytest",
            "sphinx",
            "sphinx-autodoc-typehints",
            "tox",
            "twine",
        ]
    },
    python_requires=">=3.6, <4",
    package_data={"zero_ex.middlewares": ["py.typed"]},
    package_dir={"": "src"},
    license="Apache 2.0",
    keywords=(
        "ethereum cryptocurrency 0x decentralized blockchain dex exchange"
    ),
    namespace_packages=["zero_ex"],
    packages=find_packages("src"),
    classifiers=[
        "Development Status :: 2 - Pre-Alpha",
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
