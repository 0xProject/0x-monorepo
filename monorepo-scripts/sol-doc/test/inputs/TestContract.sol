pragma solidity ^0.5;
pragma experimental ABIEncoderV2;

import "./InterfaceContract.sol";
import "./LibraryContract.sol";
import "./BaseContract.sol";


/// @dev Documentation for `TestContract`.
contract TestContract is
    BaseContract,
    InterfaceContract
{
    /// @dev Documentation for `testContractMethod1`.
    function testContractMethod1() public {}

    // Stuff to ignore.
    /// @dev Documentation for `testContractMethod2`.
    /// @param p2 Documentation for `p2`.
    /// @param p1 Documentation for `p1`.
    /// @param p3 Documentation for `p3`.
    /// @return r1 Documentation for `r1`.
    function testContractMethod2(
        address p1,
        uint256 p2,
        LibraryContract.LibraryContractEnum p3
    )
        internal
        returns (int32 r1)
    {
        return r1;
    }

    /// @dev Documentation for `testContractMethod3`.
    /// @param p1 Documentation for `p1`.
    /// @return r1 Documentation for `r1`.
    function testContractMethod3(InterfaceContract.InterfaceStruct calldata p1)
        external
        returns (bytes32[][] memory r1)
    {
        return r1;
    }

    // Documentation for `testContractMethod4`.
    function testContractMethod4(
        LibraryContract.LibraryStruct[] storage p1,
        InterfaceContract.InterfaceStruct[] memory p2,
        bytes[] memory p3
    )
        private
        returns (bytes memory r1, bytes memory r2)
    {
        return (r1, r2);
    }
}
