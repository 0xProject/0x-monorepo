pragma solidity ^0.5;
pragma experimental ABIEncoderV2;

import "./InterfaceContract.sol";
import "./LibraryContract.sol";


/// @dev Documentation for `BaseContract`.
contract BaseContract {

    /// @dev Documentation for `BaseContractEvent1`.
    /// @param p1 Documentation for `p1`.
    /// @param p2 Documentation for `p2`.
    event BaseContractEvent1(address indexed p1, InterfaceContract.InterfaceStruct p2);
    // Documentation for `BaseContractEvent2`.
    event BaseContractEvent2(
        uint256 p1,
        uint256 indexed p2
    );


    /// @dev Documentation for `baseContractField1`.
    /// @param 1 Documentation for `1`.
    /// @param 0 Documentation for `0`.
    /// @return 0 Documentation for `0`.
    mapping (bytes32 => mapping(address => InterfaceContract.InterfaceStruct)) public baseContractField1;

    /// @dev Documentation for `baseContractField2`.
    /// @param 0 Documentation for `0`.
    bytes32[] public baseContractField2;

    /// @dev Documentation for `_baseContractField3`.
    uint256 private _baseContractField3;

    /// @dev Documentation for `baseContractMethod1`.
    /// @param p1 Documentation for `p1`.
    /// @param p2 Documentation for `p2`.
    /// @return 0 Documentation for `0`.
    function baseContractMethod1(bytes memory p1, bytes32 p2)
        internal
        returns (InterfaceContract.InterfaceStruct memory)
    {}
}
