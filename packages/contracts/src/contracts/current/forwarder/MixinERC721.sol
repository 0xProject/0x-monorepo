pragma solidity ^0.4.24;
pragma experimental ABIEncoderV2;

import "../protocol/AssetProxy/MixinERC721Transfer.sol";

contract MixinERC721 is
    MixinERC721Transfer
{
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
        // Pop off the proxy id as this needs to be done prior
        popLastByte(assetData);
        MixinERC721Transfer.transferFromInternal(assetData, from, to, amount);
    }
}
