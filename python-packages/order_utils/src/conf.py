"""Configuration file for the Sphinx documentation builder."""

# Reference: http://www.sphinx-doc.org/en/master/config

from typing import List


# pylint: disable=invalid-name
# because these variables are not named in upper case, as globals should be.

project = "0x-order-utils"
# pylint: disable=redefined-builtin
copyright = "2018, ZeroEx, Intl."
author = "F. Eugene Aumson"
version = "0.1.0"  # The short X.Y version
# we should modify this version assignment to pull from setup.py like for
# __version__ in in
# https://github.com/ethereum/web3.py/blob/4c52f0d592571077ad2573cefe0587a336685d44/web3/__init__.py#L34
release = ""  # The full version, including alpha/beta/rc tags

extensions = [
    "sphinx.ext.autodoc",
    "sphinx.ext.doctest",
    "sphinx.ext.intersphinx",
    "sphinx.ext.coverage",
    "sphinx.ext.viewcode",
]

templates_path = ["doc_templates"]

source_suffix = ".rst"
# eg: source_suffix = [".rst", ".md"]

master_doc = "index"  # The master toctree document.

language = None

exclude_patterns: List[str] = []

# The name of the Pygments (syntax highlighting) style to use.
pygments_style = None

html_theme = "alabaster"

html_static_path = ["doc_static"]
# Add any paths that contain custom static files (such as style sheets) here,
# relative to this directory. They are copied after the builtin static files,
# so a file named "default.css" will overwrite the builtin "default.css".

# Output file base name for HTML help builder.
htmlhelp_basename = "order_utilspydoc"

# -- Extension configuration:

# Example configuration for intersphinx: refer to the Python standard library.
intersphinx_mapping = {"https://docs.python.org/": None}
