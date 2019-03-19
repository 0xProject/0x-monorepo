"""Middleware that captures calls to 'eth_sign'.

Description:
This middleware intercepts all calls to 'eth_sign and enforces all sign
messages to be signed with a local private key.
"""

import operator
from functools import singledispatch
from eth_account import Account, messages
from eth_account.local import LocalAccount
from eth_keys.datatypes import PrivateKey
from eth_utils import to_dict
from hexbytes import HexBytes
from zero_ex.middlewares._utils import apply_formatter_if, compose


TO_HEXSTR_FROM_ETH_KEY = operator.methodcaller("to_hex")


def is_eth_key(value):
    """Check if value is an eth_keys.PrivateKey object."""
    return isinstance(value, PrivateKey)


def key_normalizer(val):
    """Normalize private key value."""
    return compose(apply_formatter_if(is_eth_key, TO_HEXSTR_FROM_ETH_KEY, val))


@to_dict
def gen_normalized_accounts(val):
    """Generate normalized accounts."""
    if isinstance(val, (list, tuple, set)):
        for i in val:
            account = to_account(i)
            yield account.address, account
    else:
        account = to_account(val)
        yield account.address, account
        return


@singledispatch
def to_account(val):
    """Private key type must be supported."""
    raise TypeError(
        "key must be one of the types: "
        "eth_keys.datatype.PrivateKey, eth_account.local.LocalAccount, "
        "or raw private key as a hex string or byte string. "
        "Was of type {0}".format(type(val))
    )


@to_account.register(LocalAccount)
def _(val):
    return val


def private_key_to_account(val):
    """Get the account associated with the private key."""
    normalized_key = key_normalizer(val)
    return Account().privateKeyToAccount(normalized_key)


to_account.register(PrivateKey, private_key_to_account)
to_account.register(str, private_key_to_account)
to_account.register(bytes, private_key_to_account)


def construct_local_message_signer(private_key_or_account):
    """Capture calls to 'eth_sign'.

    Description:
    Intercept calls to 'eth_sign to always sign message with
    a local private key.
    Keyword arguments:
        private_key_or_account -- A single private key or a tuple,
        list or set of private keys.
        Keys can be any of the following formats:
        - An eth_account.LocalAccount object
        - An eth_keys.PrivateKey object
        - A raw private key as a hex string or byte string
    """
    accounts = gen_normalized_accounts(private_key_or_account)

    def local_message_signer_middleware(
        make_request, web3
    ):  # pylint: disable=unused-argument
        def middleware(method, params):
            if method != "eth_sign":
                return make_request(method, params)

            account = dict(accounts)[params[0]]
            msg_hash_hexbytes = messages.defunct_hash_message(
                HexBytes(params[1])
            )
            ec_signature = account.signHash(msg_hash_hexbytes)
            return {"result": ec_signature.signature}

        return middleware

    return local_message_signer_middleware
