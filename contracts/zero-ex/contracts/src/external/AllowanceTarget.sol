/*

  Copyright 2020 ZeroEx Intl.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.

*/

pragma solidity ^0.6.5;

import "@0x/contracts-utils/contracts/src/v06/AuthorizableV06.sol";

/// @dev The allowance target for the TokenSpender feature.
contract AllowanceTarget is
    AuthorizableV06
{
    fallback() external {
        assembly {
            function assertAuthorized() {
                // To lookup a value in a mapping, we load from the storage location keccak256(k, p),
                // where k is the key left padded to 32 bytes and p is the storage slot
                mstore(0, and(caller(), 0xffffffffffffffffffffffffffffffffffffffff))
                mstore(0x20, authorized_slot)

                // Revert if authorized[msg.sender] == false
                if iszero(sload(keccak256(0, 0x40))) {
                    // Revert with `SenderNotAuthorizedError(address)`
                    mstore(0, 0xb65a25b900000000000000000000000000000000000000000000000000000000)
                    mstore(4, caller())
                    revert(0, 36)
                }
            }

            // The first 4 bytes of calldata holds the function selector
            let selector := and(calldataload(0), 0xffffffff00000000000000000000000000000000000000000000000000000000)

            if eq(selector, 0x15dacbea00000000000000000000000000000000000000000000000000000000) {
                assertAuthorized()

                // selector for transferFrom(address,address,uint256)
                mstore(0, 0x23b872dd00000000000000000000000000000000000000000000000000000000)

                // Call data looks like:
                // 0x00-0x04 selector
                // 0x04-0x24 token address
                // 0x24-0x44 sender
                // 0x44-0x64 recipient
                // 0x64-0x84 amount
                calldatacopy(4, 0x24, 0x60)

                let success := call(gas(), and(calldataload(4), 0xffffffffffffffffffffffffffffffffffffffff), 0, 0, 0x64, 0, 0)

                if iszero(success) {
                    returndatacopy(0, 0, returndatasize())
                    revert(0, returndatasize())
                }

                returndatacopy(0, 0, returndatasize())
                return(0, returndatasize())
            }

            // bytes4(keccak256("executeCall(address,bytes)")) = 0xbca8c7b5
            if iszero(eq(selector, 0xbca8c7b500000000000000000000000000000000000000000000000000000000)) {
                revert(0, 0)
            }

            assertAuthorized()

            // To lookup a value in a mapping, we load from the storage location keccak256(k, p),
            // where k is the key left padded to 32 bytes and p is the storage slot
            mstore(0, and(caller(), 0xffffffffffffffffffffffffffffffffffffffff))
            mstore(0x20, authorized_slot)

            // Revert if authorized[msg.sender] == false
            if iszero(sload(keccak256(0, 0x40))) {
                // Revert with `SenderNotAuthorizedError(address)`
                mstore(0, 0xb65a25b900000000000000000000000000000000000000000000000000000000)
                mstore(4, caller())
                revert(0, 36)
            }

            // Call data for executeCall(address target, bytes callData):
            // 0x00-0x04 selector
            // 0x04-0x24 address target
            // 0x24-0x44 offset to callData, relative to 0x04

            let offset := add(calldataload(0x24), 4)

            // callData (relative to offset)
            // 0x00-0x20 size in bytes
            // 0x20-???? actual data

            let size := calldataload(offset)
            if lt(calldatasize(), add(add(offset, 0x20), size)) {
                revert(0, 0) // insufficient call data
            }
            calldatacopy(0, add(offset, 0x20), size)

            let success := call(gas(), and(calldataload(4), 0xffffffffffffffffffffffffffffffffffffffff), 0, 0, size, 0, 0)

            if iszero(success) {
                returndatacopy(0, 0, returndatasize())
                revert(0, returndatasize())
            }

            returndatacopy(0, 0, returndatasize())
            return(0, returndatasize())
        }
    }
}
