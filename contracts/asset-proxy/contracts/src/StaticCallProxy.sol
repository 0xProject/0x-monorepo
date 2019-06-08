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


contract StaticCallProxy {

    // Id of this proxy.
    bytes4 constant internal PROXY_ID = bytes4(keccak256("StaticCall(address,bytes,bytes32)"));

    // solhint-disable-next-line payable-fallback
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

                // `transferFrom`.
                // The function is marked `external`, so no abi decoding is done for
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
                // (**): see table below to compute length of assetData Contents
                // (***): Note that the `from`, `to`, and `amount` params in calldata are ignored in this function.
                //
                // WARNING: The ABIv2 specification allows additional padding between
                //          the Params and Data section. This will result in a larger
                //          offset to assetData.

                // Load offset to `assetData`
                let assetDataOffset := add(calldataload(4), 4)

                // Validate length of `assetData`
                let assetDataLen := calldataload(assetDataOffset)
                if or(lt(assetDataLen, 100), mod(sub(assetDataLen, 4), 32)) {
                    // Revert with `Error("INVALID_ASSET_DATA_LENGTH")`
                    mstore(0, 0x08c379a000000000000000000000000000000000000000000000000000000000)
                    mstore(32, 0x0000002000000000000000000000000000000000000000000000000000000000)
                    mstore(64, 0x00000019494e56414c49445f41535345545f444154415f4c454e475448000000)
                    mstore(96, 0)
                    revert(0, 100)
                }

                // Ensure that `assetData` ends inside of calldata
                let assetDataEnd := add(assetDataOffset, add(assetDataLen, 32))
                if gt(assetDataEnd, calldatasize()) {
                    // Revert with `Error("INVALID_ASSET_DATA_END")`
                    mstore(0, 0x08c379a000000000000000000000000000000000000000000000000000000000)
                    mstore(32, 0x0000002000000000000000000000000000000000000000000000000000000000)
                    mstore(64, 0x00000016494e56414c49445f41535345545f444154415f454e44000000000000)
                    mstore(96, 0)
                    revert(0, 100)
                }

                // Asset data is encoded as follows:
                // | Area     | Offset      | Length  | Contents                             |
                // |----------|-------------|---------|--------------------------------------|
                // | Header   | 0           | 4       | assetProxyId                         |
                // | Params   |             | 4 * 32  | function parameters:                 |
                // |          | 4           |         |   1. address of callTarget           |
                // |          | 36          |         |   2. offset to staticCallData (*)    |
                // |          | 68          |         |   3. expected 32 byte hash of output |
                // | Data     |             |         | staticCallData:                      |
                // |          | 100         | 32      |   1. staticCallData Length           |
                // |          | 132         | a       |   2. staticCallData Contents         | 

                // In order to find the offset to `staticCallData`, we must add:
                // assetDataOffset
                // + 32 (assetData len)
                // + 4 (proxyId)
                // + 32 (callTarget)
                let paramsInAssetDataOffset := add(assetDataOffset, 36)
                let staticCallDataOffset := add(paramsInAssetDataOffset, calldataload(add(assetDataOffset, 68)))

                // Load length of `staticCallData`
                let staticCallDataLen := calldataload(staticCallDataOffset)

                // Ensure `staticCallData` does not begin to outside of `assetData`
                let staticCallDataBegin := add(staticCallDataOffset, 32)
                let staticCallDataEnd := add(staticCallDataBegin, staticCallDataLen)
                if gt(staticCallDataEnd, assetDataEnd) {
                    // Revert with `Error("INVALID_STATIC_CALL_DATA_OFFSET")`
                    mstore(0, 0x08c379a000000000000000000000000000000000000000000000000000000000)
                    mstore(32, 0x0000002000000000000000000000000000000000000000000000000000000000)
                    mstore(64, 0x0000001f494e56414c49445f5354415449435f43414c4c5f444154415f4f4646)
                    mstore(96, 0x5345540000000000000000000000000000000000000000000000000000000000)
                    revert(0, 100)
                }

                // Copy `staticCallData` into memory
                calldatacopy(
                    0,                              // memory can be safely overwritten from beginning
                    staticCallDataBegin,            // start of `staticCallData`
                    staticCallDataLen               // copy the entire `staticCallData`
                )

                // In order to find the offset to `callTarget`, we must add:
                // assetDataOffset
                // + 32 (assetData len)
                // + 4 (proxyId)
                let callTarget := and(
                    calldataload(add(assetDataOffset, 36)),
                    0x000000000000000000000000ffffffffffffffffffffffffffffffffffffffff
                )

                // Perform `callTarget.staticcall(staticCallData)`
                let success := staticcall(
                    gas,                         // forward all gas
                    callTarget,                  // call address `callTarget`
                    0,                           // pointer to start of input
                    staticCallDataLen,           // length of input
                    0,                           // start of memory can be safely overwritten
                    0                            // don't copy output to memory
                )

                // Copy entire output to start of memory
                let outputLen := returndatasize()
                returndatacopy(
                    0,                // copy to memory at 0
                    0,                // copy from return data at 0
                    outputLen         // copy all return data
                )

                // Revert with reason given by `callTarget` if staticcall is unsuccessful
                if iszero(success) {
                    revert(0, outputLen)
                }

                // Calculate hash of output
                let callResultHash := keccak256(0, outputLen)

                // In order to find the offset to `expectedCallResultHash`, we must add:
                // assetDataOffset
                // + 32 (assetData len)
                // + 4 (proxyId)
                // + 32 (callTarget)
                // + 32 (assetDataOffset)
                let expectedResultHash := calldataload(add(assetDataOffset, 100))

                if sub(callResultHash, expectedResultHash) {
                    // Revert with `Error("UNEXPECTED_STATIC_CALL_RESULT")`
                    mstore(0, 0x08c379a000000000000000000000000000000000000000000000000000000000)
                    mstore(32, 0x0000002000000000000000000000000000000000000000000000000000000000)
                    mstore(64, 0x0000001d554e45585045435445445f5354415449435f43414c4c5f524553554c)
                    mstore(96, 0x5400000000000000000000000000000000000000000000000000000000000000)
                    revert(0, 100)
                }

                // Return if output matched expected output
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