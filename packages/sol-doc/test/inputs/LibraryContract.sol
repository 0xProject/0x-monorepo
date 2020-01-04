pragma solidity ^0.5;


/// @dev Documentation for `LibraryContract`.
contract LibraryContract {

    /// @dev Documentation for `LibraryContractEnum`.
    /// @param EnumMember1 Documentation for `EnumMember1`.
    enum LibraryContractEnum {
        EnumMember1,
        EnumMember2, // Documentation for `EnumMember2`.
        // Documentation for `EnumMember3`.
        EnumMember3,
        EnumMember4
    }

    /// @dev Documentation for `LibraryStruct`.
    /// @param structField Documentation for `structField`.
    struct LibraryStruct {
        mapping (bytes32 => address) structField;
    }
}
