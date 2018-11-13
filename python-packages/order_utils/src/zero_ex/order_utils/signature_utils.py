"""Signature utilities."""

from typing import Dict, Tuple
import json
from pkg_resources import resource_string

from eth_utils import is_address, to_checksum_address
from web3 import Web3
import web3.exceptions
from web3.utils import datatypes

from zero_ex.dev_utils.type_assertions import assert_is_hex_string


# prefer `black` formatting. pylint: disable=C0330
EXCHANGE_ABI = json.loads(
    resource_string("zero_ex.contract_artifacts", "artifacts/Exchange.json")
)["compilerOutput"]["abi"]

network_to_exchange_addr: Dict[str, str] = {
    "1": "0x4f833a24e1f95d70f028921e27040ca56e09ab0b",
    "3": "0x4530c0483a1633c7a1c97d2c53721caff2caaaaf",
    "42": "0x35dd2932454449b14cee11a94d3674a936d5d7b2",
    "50": "0x48bacb9266a570d521063ef5dd96e61686dbe788",
}


# prefer `black` formatting. pylint: disable=C0330
def is_valid_signature(
    provider: Web3.HTTPProvider, data: str, signature: str, signer_address: str
) -> Tuple[bool, str]:
    # docstring considered all one line by pylint: disable=line-too-long
    """Check the validity of the supplied signature.

    Check if the supplied ``signature`` corresponds to signing ``data`` with
    the private key corresponding to ``signer_address``.

    :param provider: A Web3 provider able to access the 0x Exchange contract.
    :param data: The hex encoded data signed by the supplied signature.
    :param signature: The hex encoded signature.
    :param signer_address: The hex encoded address that signed the data to
        produce the supplied signature.
    :rtype: Boolean indicating whether the given signature is valid.

    >>> is_valid_signature(
    ...     Web3.HTTPProvider("http://127.0.0.1:8545"),
    ...     '0x6927e990021d23b1eb7b8789f6a6feaf98fe104bb0cf8259421b79f9a34222b0',
    ...     '0x1B61a3ed31b43c8780e905a260a35faefcc527be7516aa11c0256729b5b351bc3340349190569279751135161d22529dc25add4f6069af05be04cacbda2ace225403',
    ...     '0x5409ed021d9299bf6814279a6a1411a7e866a631',
    ... )
    (True, '')
    """  # noqa: E501 (line too long)
    # TODO: make this provider check more flexible. pylint: disable=fixme
    # https://app.asana.com/0/684263176955174/901300863045491/f
    if not isinstance(provider, Web3.HTTPProvider):
        raise TypeError("provider is not a Web3.HTTPProvider")
    assert_is_hex_string(data, "data")
    assert_is_hex_string(signature, "signature")
    assert_is_hex_string(signer_address, "signer_address")
    if not is_address(signer_address):
        raise ValueError("signer_address is not a valid address")

    web3_instance = Web3(provider)
    # false positive from pylint: disable=no-member
    network_id = web3_instance.net.version
    contract_address = network_to_exchange_addr[network_id]
    # false positive from pylint: disable=no-member
    contract: datatypes.Contract = web3_instance.eth.contract(
        address=to_checksum_address(contract_address), abi=EXCHANGE_ABI
    )
    try:
        return (
            contract.call().isValidSignature(
                data, to_checksum_address(signer_address), signature
            ),
            "",
        )
    except web3.exceptions.BadFunctionCallOutput as exception:
        known_revert_reasons = [
            "LENGTH_GREATER_THAN_0_REQUIRED",
            "SIGNATURE_UNSUPPORTED",
            "LENGTH_0_REQUIRED",
            "LENGTH_65_REQUIRED",
        ]
        for known_revert_reason in known_revert_reasons:
            if known_revert_reason in str(exception):
                return (False, known_revert_reason)
        return (False, f"Unknown: {exception}")
