r"""Web3 middlewares for 0x applications.

Example::

    import os
    from web3 import Web3
    from zero_ex.web3_middlewares.local_message_signer \
        import construct_local_message_signer
    os.environ.get(WEB3_RPC_URL)
    os.environ.get(PRIVATE_KEY)
    web3_instance = Web3.HTTPProvider(WEB3_RPC_URL)
    web3_instance.middlewares.add(
        construct_local_message_signer(PRIVATE_KEY))
"""
