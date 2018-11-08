pragma solidity ^0.4.0;

contract Test {
    
    uint256 internal hiddenState;
    
    event SomeLogEvent(uint256 withValues, address indexed canBeIndexed);
    
    constructor () public {
        hiddenState = 42;
    }
    
    modifier modWithoutParameters {
        if(msg.sender == 0x3) {
            _;
        }
    }
    
    modifier modWithParameters(bytes32 hash) {
        if (keccak256(abi.encodePacked(msg.sender)) == hash) {
            revert();
        }
        _;
    }
    
    function someInternalAction(uint256[4] withParameters)
        internal
        modWithoutParameters
    {
        hiddenState = withParameters[3];
    }
    
    function someInternalFunction(uint256 x)
        internal pure
        returns (uint256 y)
    {
        y = x * x + 5;
    }
    
    function someMultiFunction(uint256 a)
        internal view
        returns (uint256 x, uint256 y)
    {
        x = hiddenState + a;
        y = x * x + 5;
    }

}
