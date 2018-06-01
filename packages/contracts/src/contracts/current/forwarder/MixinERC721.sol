pragma solidity ^0.4.24;

import "zeppelin-solidity/contracts/token/ERC721/ERC721Basic.sol";

contract MixinERC721 {
    // Equals to `bytes4(keccak256("onERC721Received(address,uint256,bytes)"))`
    bytes4 constant ERC721_RECEIVED = 0xf0b9e5ba;

    function onERC721Received(address, uint256, bytes memory)
        public
        pure
        returns(bytes4)
    {
        return ERC721_RECEIVED;
    }

    function transferNFTToken(
        address token,
        address to,
        uint256 tokenId)
        internal
    {
        ERC721Basic(token).transferFrom(address(this), to, tokenId);
    }
}