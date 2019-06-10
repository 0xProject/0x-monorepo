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

pragma solidity ^0.5.5;

import "./MixinAuthorizable.sol";


contract ERC1155Proxy is
    MixinAuthorizable
{

    // Id of this proxy.
    bytes4 constant internal PROXY_ID = bytes4(keccak256("ERC1155Assets(address,uint256[],uint256[],bytes)"));

    // solhint-disable-next-line payable-fallback
    function () 
        external
    {
        // Input calldata to this function is encoded as follows:
        //                      -- TABLE #1 --
        // | Area     | Offset (**) | Length      | Contents                        |
        // |----------|-------------|-------------|---------------------------------|
        // | Header   | 0           | 4           | function selector               |
        // | Params   |             | 4 * 32      | function parameters:            |
        // |          | 4           |             |   1. offset to assetData (*)    |
        // |          | 36          |             |   2. from                       |
        // |          | 68          |             |   3. to                         |
        // |          | 100         |             |   4. amount                     |
        // | Data     |             |             | assetData:                      |
        // |          | 132         | 32          | assetData Length                |
        // |          | 164         | (see below) | assetData Contents              |
        //
        //
        // Asset data is encoded as follows:
        //                      -- TABLE #2 --
        // | Area     | Offset      | Length  | Contents                            |
        // |----------|-------------|---------|-------------------------------------|
        // | Header   | 0           | 4       | assetProxyId                        |
        // | Params   |             | 4 * 32  | function parameters:                |
        // |          | 4           |         |   1. address of ERC1155 contract    |
        // |          | 36          |         |   2. offset to ids (*)              |
        // |          | 68          |         |   3. offset to values (*)           |
        // |          | 100         |         |   4. offset to data (*)             |
        // | Data     |             |         | ids:                                |
        // |          | 132         | 32      |   1. ids Length                     |
        // |          | 164         | a       |   2. ids Contents                   |
        // |          |             |         | values:                             |
        // |          | 164 + a     | 32      |   1. values Length                  |
        // |          | 196 + a     | b       |   2. values Contents                |
        // |          |             |         | data:                               |
        // |          | 196 + a + b | 32      |   1. data Length                    |
        // |          | 228 + a + b | c       |   2. data Contents                  |
        //
        //
        // Calldata for target ERC155 asset is encoded for safeBatchTransferFrom:
        //                      -- TABLE #3 --
        // | Area     | Offset (**) | Length  | Contents                            |
        // |----------|-------------|---------|-------------------------------------|
        // | Header   | 0           | 4       | safeBatchTransferFrom selector      |
        // | Params   |             | 5 * 32  | function parameters:                |
        // |          | 4           |         |   1. from address                   |
        // |          | 36          |         |   2. to address                     |
        // |          | 68          |         |   3. offset to ids (*)              |
        // |          | 100         |         |   4. offset to values (*)           |
        // |          | 132         |         |   5. offset to data (*)             |
        // | Data     |             |         | ids:                                |
        // |          | 164         | 32      |   1. ids Length                     |
        // |          | 196         | a       |   2. ids Contents                   |
        // |          |             |         | values:                             |
        // |          | 196 + a     | 32      |   1. values Length                  |
        // |          | 228 + a     | b       |   2. values Contents                |
        // |          |             |         | data:                               |
        // |          | 228 + a + b | 32      |   1. data Length                    |
        // |          | 260 + a + b | c       |   2. data Contents                  |
        //
        //
        // (*): offset is computed from start of function parameters, so offset
        //      by an additional 4 bytes in the calldata.
        //
        // (**): the `Offset` column is computed assuming no calldata compression;
        //       offsets in the Data Area are dynamic and should be evaluated in
        //       real-time.
        //
        // WARNING: The ABIv2 specification allows additional padding between
        //          the Params and Data section. This will result in a larger
        //          offset to assetData.
        //
        // Note: Table #1 and Table #2 exist in Calldata. We construct Table #3 in memory.
        //
        //
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
                mstore(0, caller)
                mstore(32, authorized_slot)

                 // Revert if authorized[msg.sender] == false
                if iszero(sload(keccak256(0, 64))) {
                    // Revert with `Error("SENDER_NOT_AUTHORIZED")`
                    mstore(0, 0x08c379a000000000000000000000000000000000000000000000000000000000)
                    mstore(32, 0x0000002000000000000000000000000000000000000000000000000000000000)
                    mstore(64, 0x0000001553454e4445525f4e4f545f415554484f52495a454400000000000000)
                    mstore(96, 0)
                    revert(0, 100)
                }

                // Construct Table #3 in memory, starting at memory offset 0.
                // The algorithm below maps calldata (Table #1) and assetData (Table #2) to memory (Table #3).
                // Once Table #3 ha been constructed in memory, the destination erc1155 contract is called using this
                // as its calldata. This process is divided into three steps, below.

                ////////// STEP 1/3 - Map calldata to memory (Table #1 -> Table #3) //////////

                // Store the safeBatchTransferFrom function selector, which is computed using:
                // bytes4(keccak256("safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)"))
                mstore(0, 0x2eb2c2d600000000000000000000000000000000000000000000000000000000)

                // Copy `from` and `to` fields from calldata (Table #1) into memory (Table #3)
                calldatacopy(
                    4,          // aligned such that `from` and `to` are at the correct location for Table #3
                    36,         // beginning of `from` field from Table #1
                    64          // 32 bytes for `from` + 32 bytes for `to` field
                )

                ////////// STEP 2/3 - Map assetData to memory (Table #2 -> Table #3) //////////

                // Map relevant fields from assetData (Table #2) into memory (Table #3)
                // The Contents column of Table #2 is the same as Table #3,
                // beginning from parameter 3 - `offset to ids (*)`
                // The `values` from assetData (Table #2) are multiplied by `amount` (Table #1)
                // when they are copied into memory.

                // Load offset to `assetData`
                let assetDataOffset := add(calldataload(4), 4)

                // Load length in bytes of `assetData`
                let assetDataLength := calldataload(assetDataOffset)

                // Assert that the length of asset data:
                // 1. Must be at least 132 bytes (Table #2)
                // 2. Must be a multiple of 32 (excluding the 4-byte selector)
                if or(lt(assetDataLength, 132), mod(sub(assetDataLength, 4), 32)) {
                    // Revert with `Error("INVALID_ASSET_DATA_LENGTH")`
                    mstore(0, 0x08c379a000000000000000000000000000000000000000000000000000000000)
                    mstore(32, 0x0000002000000000000000000000000000000000000000000000000000000000)
                    mstore(64, 0x00000019494e56414c49445f41535345545f444154415f4c454e475448000000)
                    mstore(96, 0)
                    revert(0, 100)
                }

                // End of asset data in calldata
                // +32 for length field
                let assetDataEnd := add(assetDataOffset, add(assetDataLength, 32))
                if gt(assetDataEnd, calldatasize()) {
                    // Revert with `Error("INVALID_ASSET_DATA_END")`
                    mstore(0, 0x08c379a000000000000000000000000000000000000000000000000000000000)
                    mstore(32, 0x0000002000000000000000000000000000000000000000000000000000000000)
                    mstore(64, 0x00000016494e56414c49445f41535345545f444154415f454e44000000000000)
                    mstore(96, 0)
                    revert(0, 100)
                }

                // Load offset to parameters section in asset data
                let paramsInAssetDataOffset := add(assetDataOffset, 36)

                // Offset of end of Data Area in memory.
                // This value will grow as we construct Table #3.
                let dataAreaEndOffset := 164

                // Load amount by which to scale values
                let amount := calldataload(100)

                // Store pointer to `ids` (Table #3)
                // Subtract 4 for `safeBatchTransferFrom` selector
                mstore(68, sub(dataAreaEndOffset, 4))

                // Ensure length of `ids` does not overflow
                let idsOffset := add(paramsInAssetDataOffset, calldataload(add(assetDataOffset, 68)))
                let idsLength := calldataload(idsOffset)
                let idsLengthInBytes := mul(idsLength, 32)
                if sub(div(idsLengthInBytes, 32), idsLength) {
                    // Revert with `Error("UINT256_OVERFLOW")`
                    mstore(0, 0x08c379a000000000000000000000000000000000000000000000000000000000)
                    mstore(32, 0x0000002000000000000000000000000000000000000000000000000000000000)
                    mstore(64, 0x0000001055494e543235365f4f564552464c4f57000000000000000000000000)
                    mstore(96, 0)
                    revert(0, 100)
                }

                // Ensure `ids` does not resolve to outside of `assetData`
                let idsBegin := add(idsOffset, 32)
                let idsEnd := add(idsBegin, idsLengthInBytes)
                if gt(idsEnd, assetDataEnd) {
                    // Revert with `Error("INVALID_IDS_OFFSET")`
                    mstore(0, 0x08c379a000000000000000000000000000000000000000000000000000000000)
                    mstore(32, 0x0000002000000000000000000000000000000000000000000000000000000000)
                    mstore(64, 0x00000012494e56414c49445f4944535f4f464653455400000000000000000000)
                    mstore(96, 0)
                    revert(0, 100)
                }

                // Copy `ids` from `assetData` (Table #2) to memory (Table #3)
                calldatacopy(
                    dataAreaEndOffset,
                    idsOffset,
                    add(idsLengthInBytes, 32)
                )
                dataAreaEndOffset := add(dataAreaEndOffset, add(idsLengthInBytes, 32))

                // Store pointer to `values` (Table #3)
                // Subtract 4 for `safeBatchTrasferFrom` selector
                mstore(100, sub(dataAreaEndOffset, 4))

                // Ensure length of `values` does not overflow
                let valuesOffset := add(paramsInAssetDataOffset, calldataload(add(assetDataOffset, 100)))
                let valuesLength := calldataload(valuesOffset)
                let valuesLengthInBytes := mul(valuesLength, 32)
                if sub(div(valuesLengthInBytes, 32), valuesLength) {
                    // Revert with `Error("UINT256_OVERFLOW")`
                    mstore(0, 0x08c379a000000000000000000000000000000000000000000000000000000000)
                    mstore(32, 0x0000002000000000000000000000000000000000000000000000000000000000)
                    mstore(64, 0x0000001055494e543235365f4f564552464c4f57000000000000000000000000)
                    mstore(96, 0)
                    revert(0, 100)
                }

                // Ensure `values` does not resolve to outside of `assetData`
                let valuesBegin := add(valuesOffset, 32)
                let valuesEnd := add(valuesBegin, valuesLengthInBytes)
                if gt(valuesEnd, assetDataEnd) {
                    // Revert with `Error("INVALID_VALUES_OFFSET")`
                    mstore(0, 0x08c379a000000000000000000000000000000000000000000000000000000000)
                    mstore(32, 0x0000002000000000000000000000000000000000000000000000000000000000)
                    mstore(64, 0x00000015494e56414c49445f56414c5545535f4f464653455400000000000000)
                    mstore(96, 0)
                    revert(0, 100)
                }

                // Store length of `values`
                mstore(dataAreaEndOffset, valuesLength)
                dataAreaEndOffset := add(dataAreaEndOffset, 32)

                // Scale and store elements of `values`
                for { let currentValueOffset := valuesBegin }
                    lt(currentValueOffset, valuesEnd)
                    { currentValueOffset := add(currentValueOffset, 32) }
                {
                    // Load value and generate scaled value
                    let currentValue := calldataload(currentValueOffset)
                    let currentValueScaled := mul(currentValue, amount)

                    // Revert if `amount` != 0 and multiplication resulted in an overflow
                    if iszero(or(
                        iszero(amount),
                        eq(div(currentValueScaled, amount), currentValue)
                    )) {
                        // Revert with `Error("UINT256_OVERFLOW")`
                        mstore(0, 0x08c379a000000000000000000000000000000000000000000000000000000000)
                        mstore(32, 0x0000002000000000000000000000000000000000000000000000000000000000)
                        mstore(64, 0x0000001055494e543235365f4f564552464c4f57000000000000000000000000)
                        mstore(96, 0)
                        revert(0, 100)
                    }

                    // There was no overflow, store the scaled token value
                    mstore(dataAreaEndOffset, currentValueScaled)
                    dataAreaEndOffset := add(dataAreaEndOffset, 32)
                }

                // Store pointer to `data` (Table #3)
                // Subtract 4 for `safeBatchTrasferFrom` selector
                mstore(132, sub(dataAreaEndOffset, 4))

                // Ensure `data` does not resolve to outside of `assetData`
                let dataOffset := add(paramsInAssetDataOffset, calldataload(add(assetDataOffset, 132)))
                let dataLengthInBytes := calldataload(dataOffset)
                let dataBegin := add(dataOffset, 32)
                let dataEnd := add(dataBegin, dataLengthInBytes)
                if gt(dataEnd, assetDataEnd) {
                    // Revert with `Error("INVALID_DATA_OFFSET")`
                    mstore(0, 0x08c379a000000000000000000000000000000000000000000000000000000000)
                    mstore(32, 0x0000002000000000000000000000000000000000000000000000000000000000)
                    mstore(64, 0x00000013494e56414c49445f444154415f4f4646534554000000000000000000)
                    mstore(96, 0)
                    revert(0, 100)
                }

                // Copy `data` from `assetData` (Table #2) to memory (Table #3)
                calldatacopy(
                    dataAreaEndOffset,
                    dataOffset,
                    add(dataLengthInBytes, 32)
                )

                // Update the end of data offset to be word-aligned
                let dataLengthInWords := div(add(dataLengthInBytes, 31), 32)
                let dataLengthInBytesWordAligned := mul(dataLengthInWords, 32)
                dataAreaEndOffset := add(dataAreaEndOffset, add(dataLengthInBytesWordAligned, 32))

                ////////// STEP 3/3 - Execute Transfer //////////
                // Load the address of the destination erc1155 contract from asset data (Table #2)
                // +32 bytes for assetData Length
                // +4 bytes for assetProxyId
                let assetAddress := and(
                    calldataload(add(assetDataOffset, 36)),
                    0x000000000000000000000000ffffffffffffffffffffffffffffffffffffffff
                )

                // Call into the destination erc1155 contract using as calldata Table #3 (constructed in-memory above)
                let success := call(
                    gas,                                    // forward all gas
                    assetAddress,                           // call address of erc1155 asset
                    0,                                      // don't send any ETH
                    0,                                      // pointer to start of input
                    dataAreaEndOffset,                      // length of input is the end of the Data Area (Table #3)
                    0,                                      // write output over memory that won't be reused
                    0                                       // don't copy output to memory
                )

                // Revert with reason given by AssetProxy if `transferFrom` call failed
                if iszero(success) {
                    returndatacopy(
                        0,                // copy to memory at 0
                        0,                // copy from return data at 0
                        returndatasize()  // copy all return data
                    )
                    revert(0, returndatasize())
                }

                // Return if call was successful
                return(0, 0)
            }

            // Revert if undefined function is called
            revert(0, 0)
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
