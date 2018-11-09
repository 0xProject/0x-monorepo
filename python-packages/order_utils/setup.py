#!/usr/bin/env python

"""setuptools module for order_utils package."""

import subprocess  # nosec
from shutil import rmtree
from os import environ, path
from pathlib import Path
from sys import argv

from distutils.command.clean import clean
import distutils.command.build_py
from setuptools import find_packages, setup
from setuptools.command.test import test as TestCommand


class TestCommandExtension(TestCommand):
    """Run pytest tests."""

    def run_tests(self):
        """Invoke pytest."""
        import pytest

        exit(pytest.main())


# pylint: disable=too-many-ancestors
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

        # HACK(gene): until eth_abi releases
        # https://github.com/ethereum/eth-abi/pull/107 , we need to simply
        # create an empty file `py.typed` in the eth_abi package directory.
        import eth_abi

        eth_abi_dir = path.dirname(path.realpath(eth_abi.__file__))
        Path(path.join(eth_abi_dir, "py.typed")).touch()

        # HACK(gene): until eth_utils fixes
        # https://github.com/ethereum/eth-utils/issues/140 , we need to simply
        # create an empty file `py.typed` in the eth_abi package directory.
        import eth_utils

        eth_utils_dir = path.dirname(path.realpath(eth_utils.__file__))
        Path(path.join(eth_utils_dir, "py.typed")).touch()

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
        rmtree("src/0x_order_utils.egg-info", ignore_errors=True)


# pylint: disable=too-many-ancestors
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


# pylint: disable=too-many-ancestors
class PublishCommand(distutils.command.build_py.build_py):
    """Custom command to publish to pypi.org."""

    description = "Publish dist/* to pypi.org. Run sdist & bdist_wheel first."

    def run(self):
        """Run twine to upload to pypi.org."""
        subprocess.check_call("twine upload dist/*".split())  # nosec


# pylint: disable=too-many-ancestors
class GanacheCommand(distutils.command.build_py.build_py):
    """Custom command to publish to pypi.org."""

    description = "Run ganache daemon to support tests."

    def run(self):
        """Run ganache."""
        cmd_line = (
            "docker run -d -p 8545:8545 0xorg/ganache-cli --gasLimit"
            + " 10000000 --db /snapshot --noVMErrorsOnRPCResponse -p 8545"
            + " --networkId 50 -m"
        ).split()
        cmd_line.append(
            "concert load couple harbor equip island argue ramp clarify fence"
            + " smart topic"
        )
        subprocess.call(cmd_line)  # nosec


with open("README.md", "r") as file_handle:
    README_MD = file_handle.read()


setup(
    name="0x-order-utils",
    version="0.1.0",
    description="Order utilities for 0x applications",
    long_description=README_MD,
    long_description_content_type="text/markdown",
    url="https://github.com/0xproject/0x-monorepo/python-packages/order_utils",
    author="F. Eugene Aumson",
    author_email="feuGeneA@users.noreply.github.com",
    cmdclass={
        "clean": CleanCommandExtension,
        "lint": LintCommand,
        "test": TestCommandExtension,
        "test_publish": TestPublishCommand,
        "publish": PublishCommand,
        "ganache": GanacheCommand,
    },
    install_requires=["eth-abi", "eth_utils", "mypy_extensions", "web3"],
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
        "zero_ex.order_utils": ["py.typed"],
        "zero_ex.contract_artifacts": ["artifacts/*"],
    },
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
        }
    },
)
