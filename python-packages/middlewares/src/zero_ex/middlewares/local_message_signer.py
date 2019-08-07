"""Middleware that captures all 'eth_sign' requests to the JSON-RPC-Server.

An adaptation of the signing middleware from `web3.py
<https://github.com/ethereum/web3.py/blob/master/web3/middleware/signing.py>`_.
This middleware intercepts all 'eth_sign' requests to
an ethereum JSON RPC-Server and signs messages with a local private key.
"""

from functools import singledispatch
from typing import Dict, List, Set, Tuple, Union
from eth_account import Account, messages
from eth_account.signers.local import LocalAccount
from eth_keys.datatypes import PrivateKey
from hexbytes import HexBytes


@singledispatch
def _to_account(private_key_or_account):
    """Get a `LocalAccount` instance from a private_key or a `LocalAccount`.

    Note that this function is overloaded based on the type on input. This
    implementation is the base case where none of the supported types are
    matched and we throw an exception.
    """
    raise TypeError(
        "key must be one of the types:"
        "eth_keys.datatype.PrivateKey, "
        "eth_account.local.LocalAccount, "
        "or raw private key as a hex string or byte string. "
        "Was of type {0}".format(type(private_key_or_account))
    )


def _private_key_to_account(private_key):
    """Get the account associated with the private key."""
    if isinstance(private_key, PrivateKey):
        private_key = private_key.to_hex()
    else:
        private_key = HexBytes(private_key).hex()
    return Account().privateKeyToAccount(private_key)


_to_account.register(LocalAccount, lambda x: x)
_to_account.register(PrivateKey, _private_key_to_account)
_to_account.register(str, _private_key_to_account)
_to_account.register(bytes, _private_key_to_account)


def construct_local_message_signer(
    private_key_or_account: Union[
        Union[LocalAccount, PrivateKey, str],
        List[Union[LocalAccount, PrivateKey, str]],
        Tuple[Union[LocalAccount, PrivateKey, str]],
        Set[Union[LocalAccount, PrivateKey, str]],
    ]
):
    """Construct a local messager signer middleware.

    :param private_key_or_account: a single private key or a tuple,
        list, or set of private keys. Keys can be any of the following
        formats:

            - An `eth_account.LocalAccount`:code: object
            - An `eth_keys.PrivateKey`:code: object
            - A raw private key as a hex `string`:code: or as `bytes`:code:
    :returns: callable local_message_signer_middleware

    >>> private_key=(
    ...     "f2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e0164837257d"
    ... )
    >>> from web3 import Web3, HTTPProvider
    >>> Web3(
    ...     HTTPProvider("https://mainnet.infura.io/v3/API_KEY")
    ... ).middleware_onion.add(
    ...     construct_local_message_signer(private_key)
    ... )

    """
    if not isinstance(private_key_or_account, (list, tuple, set)):
        private_key_or_account = [private_key_or_account]
    accounts = [_to_account(pkoa) for pkoa in private_key_or_account]
    address_to_accounts: Dict[str, LocalAccount] = {
        account.address: account for account in accounts
    }

    def local_message_signer_middleware(
        make_request, web3
    ):  # pylint: disable=unused-argument
        def middleware(method, params):
            if method != "eth_sign":
                return make_request(method, params)
            account_address, message = params[:2]
            account = address_to_accounts[account_address]
            # We will assume any string which looks like a hex is expected
            # to be converted to hex. Non-hexable strings are forcibly
            # converted by encoding them to utf-8
            try:
                message = HexBytes(message)
            except Exception:  # pylint: disable=broad-except
                message = HexBytes(message.encode("utf-8"))
            msg_hash_hexbytes = messages.defunct_hash_message(message)
            ec_signature = account.signHash(msg_hash_hexbytes)
            return {"result": ec_signature.signature}

        return middleware

    return local_message_signer_middleware
