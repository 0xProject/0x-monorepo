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
import "./MixinAuthorizable.sol";

contract ERC721Proxy is
    MixinAuthorizable
{
    // Id of this proxy.
    bytes4 constant PROXY_ID = bytes4(keccak256("ERC721Token(address,uint256,bytes)"));

    function () 
        external
    {
        assembly {
            // The first 4 bytes of calldata holds the function selector
            let selector := and(calldataload(0), 0xffffffff00000000000000000000000000000000000000000000000000000000)

            // `transferFrom` will be called with the following parameters:
            // assetData Encoded byte array.
            // from Address to transfer asset from.
            // to Address to transfer asset to.
            // amount Amount of asset to transfer.
            // bytes4(keccak256("transferFrom(bytes,address,address,uint256)")) = 0xa85e59e4
            if eq(selector, 0xa85e59e400000000000000000000000000000000000000000000000000000000) {

                // To lookup a value in a mapping, we load from the storage location keccak256(k, p),
                // where k is the key left padded to 32 bytes and p is the storage slot
                let start := mload(64)
                mstore(start, and(caller, 0xffffffffffffffffffffffffffffffffffffffff))
                mstore(add(start, 32), authorized_slot)

                // Revert if authorized[msg.sender] == false
                if iszero(sload(keccak256(start, 64))) {
                    // Revert with `Error("SENDER_NOT_AUTHORIZED")`
                    mstore(0, 0x08c379a000000000000000000000000000000000000000000000000000000000)
                    mstore(32, 0x0000002000000000000000000000000000000000000000000000000000000000)
                    mstore(64, 0x0000001553454e4445525f4e4f545f415554484f52495a454400000000000000)
                    mstore(96, 0)
                    revert(0, 100)
                }

                // `transferFrom`.
                // The function is marked `external`, so no abi decodeding is done for
                // us. Instead, we expect the `calldata` memory to contain the
                // following:
                //
                // | Area     | Offset | Length  | Contents                            |
                // |----------|--------|---------|-------------------------------------|
                // | Header   | 0      | 4       | function selector                   |
                // | Params   |        | 4 * 32  | function parameters:                |
                // |          | 4      |         |   1. offset to assetData (*)        |
                // |          | 36     |         |   2. from                           |
                // |          | 68     |         |   3. to                             |
                // |          | 100    |         |   4. amount                         |
                // | Data     |        |         | assetData:                          |
                // |          | 132    | 32      | assetData Length                    |
                // |          | 164    | **      | assetData Contents                  |
                //
                // (*): offset is computed from start of function parameters, so offset
                //      by an additional 4 bytes in the calldata.
                //
                // WARNING: The ABIv2 specification allows additional padding between
                //          the Params and Data section. This will result in a larger
                //          offset to assetData.
                
                // Asset data itself is encoded as follows:
                //
                // | Area     | Offset | Length  | Contents                            |
                // |----------|--------|---------|-------------------------------------|
                // | Header   | 0      | 4       | function selector                   |
                // | Params   |        | 3 * 32  | function parameters:                |
                // |          | 4      | 12 + 20 |   1. token address                  |
                // |          | 36     |         |   2. tokenId                        |
                // |          | 68     |         |   3. offset to receiverData (*)     |
                // | Data     |        |         | receiverData:                       |
                // |          | 100    | 32      | receiverData Length                 |
                // |          | 132    | **      | receiverData Contents               |
                
                // We construct calldata for the `token.safeTransferFrom` ABI.
                // The layout of this calldata is in the table below.
                // 
                // | Area     | Offset | Length  | Contents                            |
                // |----------|--------|---------|-------------------------------------|
                // | Header   | 0      | 4       | function selector                   |
                // | Params   |        | 4 * 32  | function parameters:                |
                // |          | 4      |         |   1. from                           |
                // |          | 36     |         |   2. to                             |
                // |          | 68     |         |   3. tokenId                        |
                // |          | 100    |         |   4. offset to receiverData (*)     |
                // | Data     |        |         | receiverData:                       |
                // |          | 132    | 32      | receiverData Length                 |
                // |          | 164    | **      | receiverData Contents               |

                // There exists only 1 of each token.
                // require(amount == 1, "INVALID_AMOUNT")
                if sub(calldataload(100), 1) {
                    // Revert with `Error("INVALID_AMOUNT")`
                    mstore(0, 0x08c379a000000000000000000000000000000000000000000000000000000000)
                    mstore(32, 0x0000002000000000000000000000000000000000000000000000000000000000)
                    mstore(64, 0x0000000e494e56414c49445f414d4f554e540000000000000000000000000000)
                    mstore(96, 0)
                    revert(0, 100)
                }
                
                // Require assetData to be at least 132 bytes
                let offset := calldataload(4)
                if lt(calldataload(add(offset, 4)), 132) {
                    // Revert with `Error("LENGTH_GREATER_THAN_131_REQUIRED")`
                    mstore(0, 0x08c379a000000000000000000000000000000000000000000000000000000000)
                    mstore(32, 0x0000002000000000000000000000000000000000000000000000000000000000)
                    mstore(64, 0x000000204c454e4754485f475245415445525f5448414e5f3133315f52455155)
                    mstore(96, 0x4952454400000000000000000000000000000000000000000000000000000000)
                    revert(0, 100)
                }
                
                /////// Setup State ///////
                // `cdStart` is the start of the calldata for
                // `token.safeTransferFrom` (equal to free memory ptr).
                let cdStart := mload(64)
                // `dataAreaLength` is the total number of words
                // needed to store `receiverData`
                // As-per the ABI spec, this value is padded up to
                // the nearest multiple of 32,
                // and includes 32-bytes for length.
                // It's calculated as folows:
                //      - Unpadded length in bytes = `mload(receiverData) + 32`
                //      - Add 31 to convert rounding down to rounding up.
                //        Combined with the previous and this is `63`.
                //      - Round down to nearest multiple of 32 by clearing
                //        bits 0x1F. This is done with `and` and a mask.

                /////// Setup Header Area ///////
                // This area holds the 4-byte `transferFromSelector`.
                // Any trailing data in transferFromSelector will be
                // overwritten in the next `mstore` call.
                mstore(cdStart, 0xb88d4fde00000000000000000000000000000000000000000000000000000000)
                
                /////// Setup Params Area ///////
                // Each parameter is padded to 32-bytes.
                // The entire Params Area is 128 bytes.
                // Notes:
                //   1. A 20-byte mask is applied to addresses
                //      to zero-out the unused bytes.
                //   2. The offset to `receiverData` is the length
                //      of the Params Area (128 bytes).
                
                let length := calldataload(add(offset, 136))
                let token := calldataload(add(offset, 40))
                
                // Round length up to multiple of 32
                length := and(add(length, 31), 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE0)
                
                // Copy `from` and `to`
                calldatacopy(add(cdStart, 4), 36, 64)
                
                // TokenId
                mstore(add(cdStart, 68), calldataload(add(offset, 72)))
                
                // Offset to receiverData
                mstore(add(cdStart, 100), 128)
                
                // receiverData (including length)
                calldatacopy(add(cdStart, 132), add(offset, 136), add(length, 32))
                
                /////// Call `token.safeTransferFrom` using the calldata ///////
                let success := call(
                    gas,                    // forward all gas
                    token,                  // call address of token contract
                    0,                      // don't send any ETH
                    cdStart,                // pointer to start of input
                    add(length, 164),       // length of input
                    0,                      // write output to null
                    0                       // output size is 0 bytes
                )
                if success {
                    return(0, 0)
                }
                
                // Revert with `Error("TRANSFER_FAILED")`
                mstore(0, 0x08c379a000000000000000000000000000000000000000000000000000000000)
                mstore(32, 0x0000002000000000000000000000000000000000000000000000000000000000)
                mstore(64, 0x0000000f5452414e534645525f4641494c454400000000000000000000000000)
                mstore(96, 0)
                revert(0, 100)
            }
        }
    }

    /// @dev Gets the proxy id associated with the proxy address.
    /// @return Proxy id.
    function getProxyId()
        external
        pure
        returns (bytes4)
    {
        return PROXY_ID;
    }
}
