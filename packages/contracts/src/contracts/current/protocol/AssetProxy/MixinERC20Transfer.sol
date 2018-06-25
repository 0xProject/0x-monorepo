/*

  Copyright 2018 ZeroEx Intl.

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

pragma solidity ^0.4.24;
pragma experimental ABIEncoderV2;

import "./mixins/MAuthorizable.sol";
import "../../utils/LibBytes/LibBytes.sol";
import "../../tokens/ERC20Token/IERC20Token.sol";

contract MixinERC20Transfer is
    MAuthorizable
{
    using LibBytes for bytes;
    
    /// @dev Internal version of `transferFrom`.
    /// @param assetData Encoded byte array.
    /// @param from Address to transfer asset from.
    /// @param to Address to transfer asset to.
    /// @param amount Amount of asset to transfer.
    function transferFromInternal(
        bytes memory assetData,
        address from,
        address to,
        uint256 amount
    )
        internal
    {
        // Decode asset data.
        address token = assetData.readAddress(16);
        
        // Transfer tokens.
        // We do a raw call so we can check the success separate
        // from the return data.
        // We construct calldata for the `token.transferFrom` ABI.
        // The layout of this calldata is in the table below.
        // 
        // | Area     | Offset | Length  | Contents                            |
        // |----------|--------|---------|-------------------------------------|
        // | Header   | 0      | 4       | function selector                   |
        // | Params   |        | 3 * 32  | function parameters:                |
        // |          | 4      |         |   1. from                           |
        // |          | 36     |         |   2. to                             |
        // |          | 68     |         |   3. amount                         |
        
        bytes4 transferFromSelector = IERC20Token(token).transferFrom.selector;
        bool success;
        assembly {
            /////// Setup State ///////
            // `cdStart` is the start of the calldata for `token.transferFrom` (equal to free memory ptr).
            let cdStart := mload(64)

            /////// Setup Header Area ///////
            // This area holds the 4-byte `transferFromSelector`.
            // Any trailing data in transferFromSelector will be
            // overwritten in the next `mstore` call.
            mstore(cdStart, transferFromSelector)

            /////// Setup Params Area ///////
            // Each parameter is padded to 32-bytes.
            // The entire Params Area is 96 bytes.
            // A 20-byte mask is applied to addresses to
            // zero-out the unused bytes.
            mstore(add(cdStart, 4), and(from, 0xffffffffffffffffffffffffffffffffffffffff))
            mstore(add(cdStart, 36), and(to, 0xffffffffffffffffffffffffffffffffffffffff))
            mstore(add(cdStart, 68), amount)

            /////// Call `token.transferFrom` using the calldata ///////
            success := call(
                gas,            // forward all gas
                token,          // call address of token contract
                0,              // don't send any ETH
                cdStart,        // pointer to start of input
                100,            // length of input
                cdStart,        // write output over input
                32              // output size should be 32 bytes
            )

            /////// Check return data. ///////
            // If there is no return data, we assume the token incorrectly
            // does not return a bool. In this case we expect it to revert
            // on failure, which was handled above.
            // If the token does return data, we require that it is a single
            // nonzero 32 bytes value.
            // So the transfer succeeded if the call succeeded and either
            // returned nothing, or returned a non-zero 32 byte value. 
            success := and(success, or(
                iszero(returndatasize),
                and(
                    eq(returndatasize, 32),
                    gt(mload(cdStart), 0)
                )
            ))
        }
        require(
            success,
            "TRANSFER_FAILED"
        );
    }
}
