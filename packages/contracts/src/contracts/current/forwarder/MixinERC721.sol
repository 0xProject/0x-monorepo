pragma solidity ^0.4.24;
pragma experimental ABIEncoderV2;

import "../utils/LibBytes/LibBytes.sol";
import "../tokens/ERC721Token/ERC721Token.sol";

contract MixinERC721
{
    using LibBytes for bytes;
    // Equals to `bytes4(keccak256("onERC721Received(address,uint256,bytes)"))`
    bytes4 constant ERC721_RECEIVED = 0xf0b9e5ba;

    function onERC721Received(address, uint256, bytes memory)
        public
        pure
        returns(bytes4)
    {
        return ERC721_RECEIVED;
    }

    function transferERC721Token(
        bytes memory assetData,
        address from,
        address to,
        uint256 amount
    )
        internal
    {
        // Decode asset data.
        address token = assetData.readAddress(16);
        uint256 tokenId = assetData.readUint256(36);
        bytes memory receiverData = assetData.readBytesWithLength(100);
        ERC721Token(token).safeTransferFrom(
            from,
            to,
            tokenId,
            receiverData
        );
    }
}
