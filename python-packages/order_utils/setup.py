"""setuptools module for order_utils package."""

import subprocess  # nosec
from shutil import rmtree
from os import path, remove, walk

from distutils.command.clean import clean  # type: ignore
from setuptools import setup  # type: ignore
import setuptools.command.build_py  # type: ignore
from setuptools.command.test import test as TestCommand  # type: ignore


class TestCommandExtension(TestCommand):
    """Run pytest tests."""

    def run_tests(self):
        """Invoke pytest."""
        import pytest  # type: ignore

        pytest.main()


# pylint: disable=too-many-ancestors
class LintCommand(setuptools.command.build_py.build_py):
    """Custom setuptools command class for running linters."""

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
            "mypy src setup.py".split(),
            # security issue checker:
            "bandit -r src ./setup.py".split(),
            # general linter:
            "pylint src test setup.py".split(),
            # pylint takes relatively long to run, so it runs last, to enable
            # fast failures.
        ]
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
        rmtree("build", ignore_errors=True)
        rmtree(".mypy_cache", ignore_errors=True)
        rmtree(".tox", ignore_errors=True)
        rmtree(".pytest_cache", ignore_errors=True)
        rmtree("src/order_utils.egg-info", ignore_errors=True)
        # delete all .pyc files
        for root, _, files in walk("."):
            for file in files:
                (_, extension) = path.splitext(file)
                if extension == '.pyc':
                    remove(path.join(root, file))


setup(
    name="order_utils",
    version="1.0.0",
    description="Order utilities for 0x applications",
    author="F. Eugene Aumson",
    cmdclass={
        "clean": CleanCommandExtension,
        "lint": LintCommand,
        "test": TestCommandExtension,
    },
    include_package_data=True,
    install_requires=["web3"],
    extras_require={
        "dev": [
            "bandit",
            "black",
            "coverage",
            "coveralls",
            "mypy",
            "pycodestyle",
            "pydocstyle",
            "pylint",
            "pytest",
            "sphinx",
            "tox",
        ]
    },
    python_requires=">=3.6, <4",
    package_data={"zero_ex.order_utils": ["py.typed"]},
    package_dir={"": "src"},
    license="Apache 2.0",
    keywords=(
        "ethereum cryptocurrency 0x decentralized blockchain dex exchange"
    ),
    packages=["zero_ex.order_utils"],
    classifiers=[
        "Development Status :: 1 - Planning",
        "Intended Audience :: Developers",
        "Intended Audience :: Financial and Insurance Industry",
        "License :: OSI Approved :: Apache Software License",
        "Natural Language :: English",
        "Operating System :: OS Independent",
        "Programming Language :: Python",
        "Programming Language :: Python :: 3 :: Only",
        "Programming Language :: Python :: 3.6",
        "Programming Language :: Python :: 3.7",
        "Topic :: Office/Business :: Financial",
        "Topic :: Software Development :: Libraries",
        "Topic :: Utilities",
    ],
    zip_safe=False,
    command_options={
        "build_sphinx": {
            "source_dir": ("setup.py", "src"),
            "build_dir": ("setup.py", "build/docs"),
        }
    },
)
