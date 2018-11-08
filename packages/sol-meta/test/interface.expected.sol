pragma solidity ^0.4.23;
pragma experimental ABIEncoderV2;

contract MAssetProxyDispatcher {
    
    uint256 dispatchTransferFrom_counter = 0;
    
    event dispatchTransferFromCalled(uint256 counter,
        bytes assetData,
        address from,
        address to,
        uint256 amount);
    
    function dispatchTransferFrom(
        bytes memory assetData,
        address from,
        address to,
        uint256 amount
    )
        internal
    {
        emit dispatchTransferFromCalled(
            dispatchTransferFrom_counter,
            assetData,
            from,
            to,
            amount
        );
        dispatchTransferFrom_counter++;
    }
    
    uint256 internal someFunction_counter = 0;
    
    struct someFunction_ReturnType {
        bool reverts;
        uint256 _arg_0;
        bytes _arg_1;
    }
    
    mapping (uint256 => someFunction_ReturnType) someFunction_returns;
    
    event someFunctionCalled(uint256 counter, uint256 a, uint256 b);
    
    function someFunctionSet(uint256 counter, someFunction_ReturnType values)
        public
    {
        (someFunction_returns[counter]) = values;
    }
    
    function someFunction(uint256 a, uint256 b)
        internal
        returns (uint256, bytes)
    {
        emit someFunctionCalled(someFunction_counter, a, b);
        (someFunction_ReturnType storage returnValues) = (someFunction_returns[someFunction_counter]);
        someFunction_counter++;
        require(!returnValues.reverts);
        return ((returnValues._arg_0), (returnValues._arg_1));
    }
}
