pragma solidity 0.5.5;
pragma experimental ABIEncoderV2;

import "@0x/contracts-utils/contracts/src/LibBytes.sol";
import "@0x/contracts-utils/contracts/src/SafeMath.sol";
import "@0x/contracts-erc1155/contracts/src/interfaces/IERC1155.sol";
import "./MixinAuthorizable.sol";


contract ERC1155Proxy is
    MixinAuthorizable,
    SafeMath
{
    using LibBytes for bytes;

    // Id of this proxy.
    bytes4 constant internal PROXY_ID = bytes4(keccak256("ERC1155Token(address,uint256[],uint256[],bytes)"));

    /// @dev Transfers assets. Either succeeds or throws.
    /// @param assetData Byte array encoded for the respective asset proxy.
    /// @param from Address to transfer asset from.
    /// @param to Address to transfer asset to.
    /// @param amount Amount of asset to transfer.
    function transferFrom(
        bytes calldata assetData,
        address from,
        address to,
        uint256 amount
    )
        external
        onlyAuthorized
    {
        // decode asset data
        bytes memory assetDataWithoutProxyId = assetData.slice(4, assetData.length - 1);
        (
            address erc1155Contract,
            uint256[] memory ids,
            uint256[] memory amounts,
            bytes memory data
        ) = abi.decode(
            assetDataWithoutProxyId,
            (address,uint256[],uint256[],bytes)
        );

        // scale values
        for(uint i = 0; i != amounts.length; ++i) {
            amounts[i] = safeMul(amount, amounts[i]);
            require(
                amounts[i] != 0,
                "TRANSFER_GREATER_THAN_ZERO_REQUIRED"
            );
        }

        // execute transfer
        IERC1155(erc1155Contract).safeBatchTransferFrom(
            from,
            to,
            ids,
            amounts,
            data
        );
    }

    /// @dev Gets the proxy id associated with the proxy address.
    /// @return Proxy id.
    function getProxyId()
        external
        pure
        returns (bytes4)
    {
        return PROXY_ID;
    }
}
