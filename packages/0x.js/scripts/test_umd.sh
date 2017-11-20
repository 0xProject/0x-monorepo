#!/usr/bin/env bash
# This script runs umd tests and cleans up after them while preserving the `return_code` for CI
# UMD tests should only be run after building the commonjs because they reuse some of the commonjs build artifacts
run-s substitute_umd_bundle run_mocha
return_code=$?
exit $return_code
