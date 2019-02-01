pragma solidity 0.4.24;
pragma experimental ABIEncoderV2;


contract StructParamAndReturn {

    struct Stuff {
        address anAddress;       
        uint256 aNumber;    
    }

    /// @dev DEV_COMMENT
    /// @param stuff STUFF_COMMENT
    /// @return RETURN_COMMENT
    function methodWithStructParamAndReturn(Stuff stuff) public pure returns(Stuff) {
        return stuff;
    }
}
