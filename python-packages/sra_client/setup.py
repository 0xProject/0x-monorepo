#!/usr/bin/env python
# coding: utf-8


from setuptools import setup, find_packages  # noqa: H301

NAME = "0x-sra-client"
VERSION = "1.0.0"
# To install the library, run the following
#
# python setup.py install
#
# prerequisite: setuptools
# http://pypi.python.org/pypi/setuptools

with open("README.md", "r") as file_handle:
    README_MD = file_handle.read()

REQUIRES = ["urllib3 >= 1.15", "six >= 1.10", "certifi", "python-dateutil"]

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
)
