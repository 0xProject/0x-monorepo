#!/usr/bin/env python

"""Run a command in every package, in order of increasing dependency."""

import os
import subprocess
import sys


PACKAGE_DEPENDENCY_LIST = [
    # Order matters!  Packages must be handled in dependency order (most
    # independent first) in order for them to resolve properly.
    "contract_addresses",
    "contract_artifacts",
    "json_schemas",
    "sra_client",
    "order_utils",
    "middlewares",
    "sra_demos",
]

for package in PACKAGE_DEPENDENCY_LIST:
    print(f"Running command `{sys.argv[1:]}` in package {package}")
    os.chdir(package)
    subprocess.check_call(sys.argv[1:])
    os.chdir("..")
