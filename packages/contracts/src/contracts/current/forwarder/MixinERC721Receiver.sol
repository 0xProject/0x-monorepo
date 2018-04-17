pragma solidity ^0.4.21;

contract MixinERC721Receiver {
    // Equals to `bytes4(keccak256("onERC721Received(address,uint256,bytes)"))`
    bytes4 constant ERC721_RECEIVED = 0xf0b9e5ba;

    function onERC721Received(address, uint256, bytes)
        public
        pure
        returns(bytes4)
    {
        return ERC721_RECEIVED;
    }
}