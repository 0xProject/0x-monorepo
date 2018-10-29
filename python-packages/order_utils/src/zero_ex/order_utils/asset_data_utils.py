"""Asset data encoding and decoding utilities."""

from mypy_extensions import TypedDict

import eth_abi

from zero_ex.dev_utils import abi_utils
from zero_ex.dev_utils.type_assertions import assert_is_string, assert_is_int


ERC20_ASSET_DATA_BYTE_LENGTH = 36
ERC721_ASSET_DATA_MINIMUM_BYTE_LENGTH = 53
SELECTOR_LENGTH = 10


class ERC20AssetData(TypedDict):
    """Object interface to ERC20 asset data."""

    asset_proxy_id: str
    token_address: str


class ERC721AssetData(TypedDict):
    """Object interface to ERC721 asset data."""

    asset_proxy_id: str
    token_address: str
    token_id: int


def encode_erc20_asset_data(token_address: str) -> str:
    """Encode an ERC20 token address into an asset data string.

    :param token_address: the ERC20 token's contract address.
    :rtype: hex encoded asset data string, usable in the makerAssetData or
        takerAssetData fields in a 0x order.

    >>> encode_erc20_asset_data('0x1dc4c1cefef38a777b15aa20260a54e584b16c48')
    '0xf47261b00000000000000000000000001dc4c1cefef38a777b15aa20260a54e584b16c48'
    """
    assert_is_string(token_address, "token_address")

    return (
        "0x"
        + abi_utils.simple_encode("ERC20Token(address)", token_address).hex()
    )


def decode_erc20_asset_data(asset_data: str) -> ERC20AssetData:
    # docstring considered all one line by pylint: disable=line-too-long
    """Decode an ERC20 asset data hex string.

    :param asset_data: String produced by prior call to encode_erc20_asset_data()

    >>> decode_erc20_asset_data("0xf47261b00000000000000000000000001dc4c1cefef38a777b15aa20260a54e584b16c48")
    {'asset_proxy_id': '0xf47261b0', 'token_address': '0x1dc4c1cefef38a777b15aa20260a54e584b16c48'}
    """  # noqa: E501 (line too long)
    assert_is_string(asset_data, "asset_data")

    if len(asset_data) < ERC20_ASSET_DATA_BYTE_LENGTH:
        raise ValueError(
            "Could not decode ERC20 Proxy Data. Expected length of encoded"
            + f" data to be at least {str(ERC20_ASSET_DATA_BYTE_LENGTH)}."
            + f" Got {str(len(asset_data))}."
        )

    asset_proxy_id: str = asset_data[0:SELECTOR_LENGTH]
    if asset_proxy_id != abi_utils.method_id("ERC20Token", ["address"]):
        raise ValueError(
            "Could not decode ERC20 Proxy Data. Expected Asset Proxy Id to be"
            + f" ERC20 ({abi_utils.method_id('ERC20Token', ['address'])})"
            + f" but got {asset_proxy_id}."
        )

    # workaround for https://github.com/PyCQA/pylint/issues/1498
    # pylint: disable=unsubscriptable-object
    token_address = eth_abi.decode_abi(
        ["address"], bytes.fromhex(asset_data[SELECTOR_LENGTH:])
    )[0]

    return {"asset_proxy_id": asset_proxy_id, "token_address": token_address}


def encode_erc721_asset_data(token_address: str, token_id: int) -> str:
    # docstring considered all one line by pylint: disable=line-too-long
    """Encode an ERC721 asset data hex string.

    :param token_address: the ERC721 token's contract address.
    :param token_id: the identifier of the asset's instance of the token.
    :rtype: hex encoded asset data string, usable in the makerAssetData or
        takerAssetData fields in a 0x order.

    >>> encode_erc721_asset_data('0x1dc4c1cefef38a777b15aa20260a54e584b16c48', 1)
    '0x025717920000000000000000000000001dc4c1cefef38a777b15aa20260a54e584b16c480000000000000000000000000000000000000000000000000000000000000001'
    """  # noqa: E501 (line too long)
    assert_is_string(token_address, "token_address")
    assert_is_int(token_id, "token_id")

    return (
        "0x"
        + abi_utils.simple_encode(
            "ERC721Token(address,uint256)", token_address, token_id
        ).hex()
    )


def decode_erc721_asset_data(asset_data: str) -> ERC721AssetData:
    # docstring considered all one line by pylint: disable=line-too-long
    """Decode an ERC721 asset data hex string.

    >>> decode_erc721_asset_data('0x025717920000000000000000000000001dc4c1cefef38a777b15aa20260a54e584b16c480000000000000000000000000000000000000000000000000000000000000001')
    {'asset_proxy_id': '0x02571792', 'token_address': '0x1dc4c1cefef38a777b15aa20260a54e584b16c48', 'token_id': 1}
    """  # noqa: E501 (line too long)
    assert_is_string(asset_data, "asset_data")

    if len(asset_data) < ERC721_ASSET_DATA_MINIMUM_BYTE_LENGTH:
        raise ValueError(
            "Could not decode ERC721 Asset Data. Expected length of encoded"
            + f"data to be at least {ERC721_ASSET_DATA_MINIMUM_BYTE_LENGTH}. "
            + f"Got {len(asset_data)}."
        )

    asset_proxy_id: str = asset_data[0:SELECTOR_LENGTH]
    # prefer `black` formatting.  pylint: disable=C0330
    if asset_proxy_id != abi_utils.method_id(
        "ERC721Token", ["address", "uint256"]
    ):
        raise ValueError(
            "Could not decode ERC721 Asset Data. Expected Asset Proxy Id to be"
            + f" ERC721 ("
            + f"{abi_utils.method_id('ERC721Token', ['address', 'uint256'])}"
            + f"), but got {asset_proxy_id}"
        )

    (token_address, token_id) = eth_abi.decode_abi(
        ["address", "uint256"], bytes.fromhex(asset_data[SELECTOR_LENGTH:])
    )

    return {
        "asset_proxy_id": asset_proxy_id,
        "token_address": token_address,
        "token_id": token_id,
    }
