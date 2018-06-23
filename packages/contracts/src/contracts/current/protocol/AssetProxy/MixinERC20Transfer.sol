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

import "../../utils/LibBytes/LibBytes.sol";
import "../../tokens/ERC20Token/IERC20Token.sol";
import "./libs/LibTransferErrors.sol";

contract MixinERC20Transfer is
    LibTransferErrors
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
        
        bytes4 transferFromSelector = IERC20Token(token).transferFrom.selector;
        bool success;
        assembly {
            /////// Setup State ///////
            // `cdStart` is the start of the calldata for `token.transferFrom` (equal to free memory ptr).
            let cdStart := mload(64)
            // `cdEnd` is the end of the calldata for `token.transferFrom`.
            let cdEnd := add(cdStart, 100)

            /////// Setup Header Area ///////
            // This area holds the 4-byte `transferFromSelector`.
            mstore(cdStart, transferFromSelector)

            /////// Setup Params Area ///////
            // Each parameter is padded to 32-bytes. The entire Params Area is 96 bytes.
            // A 20-byte mask is applied to addresses to zero-out the unused bytes.
            mstore(add(cdStart, 4), and(from, 0xffffffffffffffffffffffffffffffffffffffff))
            mstore(add(cdStart, 36), and(to, 0xffffffffffffffffffffffffffffffffffffffff))
            mstore(add(cdStart, 68), amount)

            /////// Call `token.transferFrom` using the constructed calldata ///////
            success := call(
                gas,
                token,
                0,
                cdStart,
                sub(cdEnd, cdStart),
                cdStart,
                32
            )
            if success {
                if returndatasize {
                    success := 0
                    if eq(returndatasize, 32) {
                        // First 64 bytes of memory are reserved scratch space
                        returndatacopy(0, 0, 32)
                        success := mload(0)
                    }
                }
                
            }
        }
        require(
            success,
            TRANSFER_FAILED
        );
    }
}
