pragma solidity ^0.5;


contract InterfaceContract {

    /// @dev Documentation for `InterfaceStruct`.
    /// @param structField2 Documentation for `structField2`.
    struct InterfaceStruct {
        address structField1; // Documentation for `structField1`.
        uint256 structField2; // Stuff to ignore.
        // Documentation for `structField3`.
        bytes32 structField3;
    }
}
