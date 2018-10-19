"""Asset data encoding and decoding utilities."""

from mypy_extensions import TypedDict

import eth_abi  # type: ignore

from zero_ex import abi_utils
from zero_ex.type_assertions import string_or_type_error


ERC20_ASSET_DATA_BYTE_LENGTH = 36
SELECTOR_LENGTH = 10


class ERC20AssetData(TypedDict):
    """Object interface to ERC20 asset data."""

    asset_proxy_id: str
    token_address: str


def encode_erc20_asset_data(token_address: str) -> str:
    """Encode an ERC20 token address into an asset data string.

    :param token_address: the ERC20 token's contract address.
    :rtype: hex encoded asset data string, usable in the makerAssetData or
        takerAssetData fields in a 0x order.

    >>> encode_erc20_asset_data('0x1dc4c1cefef38a777b15aa20260a54e584b16c48')
    '0xf47261b00000000000000000000000001dc4c1cefef38a777b15aa20260a54e584b16c48'
    """
    string_or_type_error(token_address)

    return (
        "0x"
        + abi_utils.simple_encode("ERC20Token(address)", token_address).hex()
    )


def decode_erc20_asset_data(asset_data: str) -> ERC20AssetData:
    # docstring considered all one line by pylint: disable=line-too-long
    """Decode an ERC20 assetData hex string.

    :param asset_data: String produced by prior call to encode_erc20_asset_data()

    >>> decode_erc20_asset_data("0xf47261b00000000000000000000000001dc4c1cefef38a777b15aa20260a54e584b16c48")
    {'asset_proxy_id': '0xf47261b0', 'token_address': '0x1dc4c1cefef38a777b15aa20260a54e584b16c48'}
    """  # noqa: E501 (line too long)
    string_or_type_error(asset_data)

    if len(asset_data) < ERC20_ASSET_DATA_BYTE_LENGTH:
        raise ValueError(
            "Could not decode ERC20 Proxy Data. Expected length of encoded"
            + " data to be at least "
            + str(ERC20_ASSET_DATA_BYTE_LENGTH)
            + ". Got "
            + str(len(asset_data))
            + "."
        )

    asset_proxy_id: str = asset_data[0:10]
    if asset_proxy_id != abi_utils.method_id("ERC20Token", ["address"]):
        raise ValueError(
            "Could not decode ERC20 Proxy Data. Expected Asset Proxy Id to be"
            + " ERC20 ("
            + abi_utils.method_id("ERC20Token", ["address"])
            + ")"
            + " but got "
            + asset_proxy_id
            + "."
        )

    # workaround for https://github.com/PyCQA/pylint/issues/1498
    # pylint: disable=unsubscriptable-object
    token_address = eth_abi.decode_abi(
        ["address"], bytes.fromhex(asset_data[SELECTOR_LENGTH:])
    )[0]

    return {"asset_proxy_id": asset_proxy_id, "token_address": token_address}
