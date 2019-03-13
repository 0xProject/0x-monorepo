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

pragma solidity 0.4.24;

import "./MixinAuthorizable.sol";


contract ERC1155Proxy is
    MixinAuthorizable
{

    // Id of this proxy.
    bytes4 constant internal PROXY_ID = bytes4(keccak256("ERC1155Token(address,uint256[],uint256[],bytes)"));

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
        // |          |             |         | data                                |
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
        // |          |             |         | data                                |
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
        // Note: Table #1 and Table #2 exists in Calldata. We construct Table #3 in memory. 
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
                // The algorithm below maps asset data from Table #1 and Table #2 to Table #3, while
                // scaling the `values` (Table #2) by `amount` (Table #1). Once Table #3 has
                // been constructed in memory, the destination erc1155 contract is called using this 
                // as its calldata. This process is divided into four steps, below.

                ////////// STEP 1/4 //////////
                // Map relevant fields from assetData (Table #2) into memory (Table #3)
                // The Contents column of Table #2 is the same as Table #3,
                // beginning from parameter 3 - `offset to ids (*)`
                // The offsets in these rows are offset by 32 bytes in Table #3.
                // Strategy:
                // 1. Copy the assetData into memory at offset 32
                // 2. Increment by 32 the offsets to `ids`, `values`, and `data`

                // Load offset to `assetData`
                let assetDataOffset := calldataload(4)

                // Load length in bytes of `assetData`, computed by:
                // 4 (function selector)
                // + assetDataOffset
                let assetDataLength := calldataload(add(4, assetDataOffset))

                // This corresponds to the beginning of the Data Area for Table #3.
                // Computed by:
                // 4 (function selector)
                // + assetDataOffset
                // + 32 (length of assetData)
                calldatacopy(32, add(36, assetDataOffset), assetDataLength)

                // Increment by 32 the offsets to `ids`, `values`, and `data`
                mstore(68, add(mload(68), 32))
                mstore(100, add(mload(100), 32))
                mstore(132, add(mload(132), 32))

                // Record the address of the destination erc1155 asset for later.
                let assetAddress := and(
                    mload(36),
                    0x000000000000000000000000ffffffffffffffffffffffffffffffffffffffff
                )

                ////////// STEP 2/4 //////////
                let scaleAmount := calldataload(100)
                let valuesOffset := add(mload(100), 4) // add 4 for calldata offset
                let valuesLengthInBytes := mul(
                    mload(valuesOffset),
                    32
                )
                let valuesBegin := add(valuesOffset, 32)
                let valuesEnd := add(valuesBegin, valuesLengthInBytes)
                for { let tokenValueOffset := valuesBegin }
                    lt(tokenValueOffset, valuesEnd)
                    { tokenValueOffset := add(tokenValueOffset, 32) }
                {
                    // Load token value and generate scaled value
                    let tokenValue := mload(tokenValueOffset)
                    let scaledTokenValue := mul(tokenValue, scaleAmount)
                    
                    // Check if scaled value is zero
                    if iszero(scaledTokenValue) {
                        // Revert with `Error("TRANSFER_GREATER_THAN_ZERO_REQUIRED")`
                        mstore(0, 0x08c379a000000000000000000000000000000000000000000000000000000000)
                        mstore(32, 0x0000002000000000000000000000000000000000000000000000000000000000)
                        mstore(64, 0x000000235452414e534645525f475245415445525f5448414e5f5a45524f5f52)
                        mstore(96, 0x4551554952454400000000000000000000000000000000000000000000000000)
                        mstore(128, 0)
                        revert(0, 132)
                    }

                    // Check for multiplication overflow
                    let expectedTokenValue := div(scaledTokenValue, scaleAmount)
                    if iszero(eq(expectedTokenValue, tokenValue)) {
                        // Revert with `Error("UINT256_OVERFLOW")`
                        mstore(0, 0x08c379a000000000000000000000000000000000000000000000000000000000)
                        mstore(32, 0x0000002000000000000000000000000000000000000000000000000000000000)
                        mstore(64, 0x0000001055494e543235365f4f564552464c4f57000000000000000000000000)
                        mstore(96, 0)
                        revert(0, 100)
                    }

                    // There was no overflow, update `tokenValue` with its scaled counterpart
                    mstore(tokenValueOffset, scaledTokenValue)
                }

                ////////// STEP 3/4 //////////
                // Store the safeBatchTransferFrom function selector,
                // and copy `from`/`to` fields from Table #1 to Table #3.

                // The function selector is computed using:
                // bytes4(keccak256("safeBatchTransferFrom(address,address,uint256[],uint256[],bytes)"))
                mstore(0, 0x2eb2c2d600000000000000000000000000000000000000000000000000000000)

                // Copy `from` and `to` fields from Table #1 to Table #3
                calldatacopy(4, 36, 64)

                ////////// STEP 4/4 //////////
                // Call into the destination erc1155 contract using as calldata Table #3 (constructed in-memory above)
                let success := call(
                    gas,                                    // forward all gas
                    assetAddress,                           // call address of erc1155 asset
                    0,                                      // don't send any ETH
                    0,                                      // pointer to start of input
                    add(assetDataLength, 32),               // length of input (Table #3) is 32 bytes longer than `assetData` (Table #2)
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
