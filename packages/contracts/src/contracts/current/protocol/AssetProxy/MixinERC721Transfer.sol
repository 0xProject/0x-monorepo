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
import "./libs/LibTransferErrors.sol";

contract MixinERC721Transfer is
    LibTransferErrors,
    MAuthorizable
{
    using LibBytes for bytes;
    
    bytes4 constant SAFE_TRANSFER_FROM_SELECTOR = bytes4(keccak256("safeTransferFrom(address,address,uint256,bytes)"));
    /// @dev Internal version of `transferFrom`.
    /// @param assetData Encoded byte array.
    /// @param from Address to transfer asset from.
    /// @param to Address to transfer asset to.
    /// @param amount Amount of asset to transfer.
    function transferFrom(
        bytes assetData,
        address from,
        address to,
        uint256 amount
    )
        external
        onlyAuthorized()
    {
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

        // bytes4 safeTransferFromSelector = SAFE_TRANSFER_FROM_SELECTOR;
        // bool success;
        assembly {
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
                // Revert with `Error("ASSET_DATA_TO_SHORT")`
                mstore(0, 0x08c379a000000000000000000000000000000000000000000000000000000000)
                mstore(32, 0x0000002000000000000000000000000000000000000000000000000000000000)
                mstore(64, 0x0000001341535345545f444154415f544f5f53484f5254000000000000000000)
                mstore(96, 0)
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
            
            let length := calldataload(add(offset, 104))
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
            calldatacopy(add(cdStart, 132), add(offset, 104), add(length, 32))
            
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
            
            if iszero(success) {
                // Revert with `Error("TRANSFER_FAILED")`
                mstore(0, 0x08c379a000000000000000000000000000000000000000000000000000000000)
                mstore(32, 0x0000002000000000000000000000000000000000000000000000000000000000)
                mstore(64, 0x0000000f5452414e534645525f4641494c454400000000000000000000000000)
                mstore(96, 0)
                revert(0, 100)
            }
        }
    }

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
        // There exists only 1 of each token.
        require(
            amount == 1,
            INVALID_AMOUNT
        );
    
        // Decode asset data.
        (
            address token,
            uint256 tokenId,
            bytes memory receiverData
        ) = decodeERC721AssetData(assetData);

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

        bytes4 safeTransferFromSelector = SAFE_TRANSFER_FROM_SELECTOR;
        bool success;
        assembly {
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
            let dataAreaLength := and(add(mload(receiverData), 63), 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFE0)
            // `cdEnd` is the end of the calldata for `token.safeTransferFrom`.
            let cdEnd := add(cdStart, add(132, dataAreaLength))

            /////// Setup Header Area ///////
            // This area holds the 4-byte `transferFromSelector`.
            // Any trailing data in transferFromSelector will be
            // overwritten in the next `mstore` call.
            mstore(cdStart, safeTransferFromSelector)
            
            /////// Setup Params Area ///////
            // Each parameter is padded to 32-bytes.
            // The entire Params Area is 128 bytes.
            // Notes:
            //   1. A 20-byte mask is applied to addresses
            //      to zero-out the unused bytes.
            //   2. The offset to `receiverData` is the length
            //      of the Params Area (128 bytes).
            mstore(add(cdStart, 4), and(from, 0xffffffffffffffffffffffffffffffffffffffff))
            mstore(add(cdStart, 36), and(to, 0xffffffffffffffffffffffffffffffffffffffff))
            mstore(add(cdStart, 68), tokenId)
            mstore(add(cdStart, 100), 128)

            /////// Setup Data Area ///////
            // This area holds `receiverData`.
            let dataArea := add(cdStart, 132)
            for {} lt(dataArea, cdEnd) {} {
                mstore(dataArea, mload(receiverData))
                dataArea := add(dataArea, 32)
                receiverData := add(receiverData, 32)
            }
            
            /////// Call `token.safeTransferFrom` using the calldata ///////
            success := call(
                gas,                    // forward all gas
                token,                  // call address of token contract
                0,                      // don't send any ETH
                cdStart,                // pointer to start of input
                sub(cdEnd, cdStart),    // length of input
                cdStart,                // write output over input
                0                       // output size is 0 bytes
            )
        }
        require(
            success,
            TRANSFER_FAILED
        );
    }

    /// @dev Decodes ERC721 Asset data.
    /// @param assetData Encoded byte array.
    /// @return proxyId Intended ERC721 proxy id.
    /// @return token ERC721 token address.
    /// @return tokenId ERC721 token id.
    /// @return receiverData Additional data with no specific format, which
    ///                      is passed to the receiving contract's onERC721Received.
    function decodeERC721AssetData(bytes memory assetData)
        internal
        pure
        returns (
            address token,
            uint256 tokenId,
            bytes memory receiverData
        )
    {
        // Decode asset data.
        token = assetData.readAddress(16);
        tokenId = assetData.readUint256(36);
        receiverData = assetData.readBytesWithLength(100);

        return (
            token,
            tokenId,
            receiverData
        );
    }
}
