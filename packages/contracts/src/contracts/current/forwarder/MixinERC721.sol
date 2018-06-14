pragma solidity ^0.4.24;
pragma experimental ABIEncoderV2;

import "zeppelin-solidity/contracts/token/ERC721/ERC721Basic.sol";
import "../protocol/AssetProxy/ERC721Proxy.sol";

contract MixinERC721 is
    ERC721Proxy
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
        address token,
        address from,
        address to,
        uint256 tokenId
        // bytes memory assetData,
        // address from,
        // address to,
        // uint256 amount
    )
        internal
    {
        // (
        //     address token,
        //     uint256 tokenId,
        //     bytes memory receiverData
        // ) = ERC721Proxy.decodeERC721AssetData(assetData);
        ERC721Basic(token).transferFrom(from, to, tokenId);
        // ERC721Proxy.transferFromInternal(assetData, from, to, amount);
    }
}
