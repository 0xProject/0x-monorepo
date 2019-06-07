pragma solidity ^0.5.9;


contract IDispatcher {
    function _dispatchTransferFrom(
        bytes32 orderHash,
        bytes memory assetData,
        address from,
        address to,
        uint256 amount
    )
        internal;
}
