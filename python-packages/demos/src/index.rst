.. source for the sphinx-generated build/docs/web/index.html

Create and Validate Orders
=================================

.. toctree::
   :maxdepth: 2
   :caption: Contents:

In this demo, we will show you how you can use our `python packages
<https://github.com/0xProject/0x-monorepo#python-packages/>`_
to create, and validate orders via the 0x protocol.

Installing
----------
Install the 0x-order-utils and the 0x-json-schemas packages with pip:

`pip install 0x-order-utils`:code:

`pip install 0x-json-schemas`:code:


Usage
-----

.. automodule:: demo_zero_ex_orders
   :members:

Using the Python SRA_Client
=================================

0x Protocol is an open standard.  Many relayers opt-in to implementing a set of 
`standard relayer API endpoints <http://sra-spec.s3-website-us-east-1.amazonaws.com/>`_ 
to it easier for anyone to source liquidity that conforms to the 0x order format. 
Here, we will show you how you can use our `python sra_client 
<https://github.com/0xProject/0x-monorepo/tree/development/python-packages/sra_client#0x-sra-client>`_ 
module to interact with 0x relayers that implements the standard relayer API.

Setup
-----
Install the sra-client package with pip:

`pip install https://github.com/0xproject/0x-monorepo/python-packages/sra_client`:code:

To interact with a 0x-relayer, you need the HTTP endpoint of the relayer you'd like to 
connect to (i.e. https://api.radarrelay.com/0x/v2). 

For local testing one use the `0x-launch-kit 
<https://github.com/0xProject/0x-launch-kit#table-of-contents/>`_
to host orders locally. For convenience, a docker container is provided 
for just this purpose. To start it:

`docker run -d -p 3000:3000 0xorg/launch-kit-ci`:code:

and then connect to the http server running at http://localhost:3000.

Usage
-----

.. automodule:: demo_sra_client
   :members:

Indices and tables
==================

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`
