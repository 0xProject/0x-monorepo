pragma solidity ^0.5.9;


contract IGetContext {
    function _getCurrentContextAddress()
        internal
        view
        returns (address);
}
