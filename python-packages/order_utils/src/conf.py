"""Configuration file for the Sphinx documentation builder."""

# Reference: http://www.sphinx-doc.org/en/master/config

from typing import List
import pkg_resources


# pylint: disable=invalid-name
# because these variables are not named in upper case, as globals should be.

project = "0x-order-utils"
# pylint: disable=redefined-builtin
copyright = "2018, ZeroEx, Intl."
author = "F. Eugene Aumson"
version = pkg_resources.get_distribution("0x-order-utils").version
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
