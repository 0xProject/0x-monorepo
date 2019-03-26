.. source for the sphinx-generated build/docs/web/index.html

Python zero_ex.sra_client.api_client
====================================
0x Protocol is an open standard.  Many relayers opt-in to implementing a set of
`standard relayer API endpoints <http://sra-spec.s3-website-us-east-1.amazonaws.com/>`_
to make it easier for anyone to source liquidity that conforms to the 0x order format.
Here, we will show you how you can use our `python sra_client
<https://github.com/0xProject/0x-monorepo/tree/development/python-packages/sra_client#0x-sra-client>`_
module to interact with 0x relayers that implements the Standard Relayer API.

Setup
-----
Install the sra-client package with pip:

`pip install 0x-sra-client`:code:

To interact with a 0x Relayer, you need the HTTP endpoint of the Relayer you'd like to
connect to (i.e. https://api.radarrelay.com/0x/v2).

For local testing one can use the `0x-launch-kit
<https://github.com/0xProject/0x-launch-kit#table-of-contents/>`_
to host orders locally. For convenience, a docker container is provided
for just this purpose. To start it:

`docker run -d -p 3000:3000 0xorg/launch-kit-ci`:code:

and then connect to the http server running at http://localhost:3000.

.. toctree::
   :maxdepth: 2
   :caption: Contents:

Demo
----

.. automodule:: sra_client

API
---

.. automodule:: sra_client.api.default_api
   :members:

Indices and tables
==================

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`
