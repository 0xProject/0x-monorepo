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
pragma experimental ABIEncoderV2;

import "../../utils/LibBytes/LibBytes.sol";
import "./MixinAuthorizable.sol";


contract BasketProxy is
    MixinAuthorizable
{
    address internal ERC721_PROXY;
    address internal ERC20_PROXY;
    // Id of this proxy.
    bytes4 constant internal PROXY_ID = bytes4(keccak256("BasketTokens(address[][],uint256[][])"));
    function BasketTokens(
        address[][] tokenAddresses,
        uint256[][] amounts
    )
        public
    {
        return;
    }
    constructor(address erc721Proxy, address erc20Proxy) {
        ERC20_PROXY = erc20Proxy;
        ERC721_PROXY = erc721Proxy;
    }

    // solhint-disable-next-line payable-fallback
    function ()
        external
    {
        assembly {
            // The first 4 bytes of calldata holds the function selector
            let selector := and(calldataload(0), 0xffffffff00000000000000000000000000000000000000000000000000000000)
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
                // There exists only 1 of each basket.
                // require(amount == 1, "INVALID_AMOUNT")
                if sub(calldataload(100), 1) {
                    // Revert with `Error("INVALID_AMOUNT")`
                    mstore(0, 0x08c379a000000000000000000000000000000000000000000000000000000000)
                    mstore(32, 0x0000002000000000000000000000000000000000000000000000000000000000)
                    mstore(64, 0x0000000e494e56414c49445f414d4f554e540000000000000000000000000000)
                    mstore(96, 0)
                    revert(0, 100)
                }
                // `transferFrom`.
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
                // We will be forwarding this data to the respective proxies as a call to
                // bytes4(keccak256("transferFrom(bytes,address,address,uint256)")) = 0xa85e59e4
                mstore(0, 0xa85e59e400000000000000000000000000000000000000000000000000000000)
                // We copy the fields `assetDataOffset`, `from` `to`, `amount` in bulk
                // from our own calldata to the new calldata.
                calldatacopy(4, 4, 128)
                // write transferFrom ERC721 assetDataLength 4+32+32 = 68
                mstore(132, 0x0000000000000000000000000000000000000000000000000000000000000044)
                // Write ERC721 Proxy Id = 0x02571792
                mstore(164, 0x0257179200000000000000000000000000000000000000000000000000000000)
                // Asset function selector begins at 164 for 4 bytes
                // Asset data begins at offset 168
                // Asset data itself is encoded as follows:
                // | Area     | Offset     | Length  | Contents                            |
                // |----------|------------|---------|-------------------------------------|
                // | Header   | 0          | 4       | function selector                   |
                // | Params   |            |         | function parameters:                |
                // |          | 4          | 32      |   1. contracts[][] offset (O1)      |
                // |          | 36         | 32      |   2. tokenIds[][] offset  (O2)      |
                // |          | 68         | 32      |   3. contracts length (A)           |
                // |          | 100        | 32      |   4.                                |
                // |          | 132        | 32      |   5.                                |
                // |   O1     | 164        | 32      |   6. contracts[0].length (B)        |
                // |   ***    | 164+B*32   | 32      |      contracts[0][n] (erc721)       |
                // |          |            | 32      |   7. contracts[1].length            |
                // |   ***    |            | 32      |      contracts[1][n] (erc20)        |
                // |   O2     | O2         | 32      |   8. tokenIds length (C)            |
                // |          | O2+32      | 32      |   9.                                |
                // |          | O2+64      | 32      |   10.                               |
                // |          | O2+96      | 32      |   11. tokenIds[0].length (D)        |
                // |   ***    | O2+128     | 32      |       tokenIds[0][n] (erc721)       |
                // |          | O2+160     | 32      |   12. tokenIds[1].length            |
                // |   ***    | O2+192     | 32      |       tokenIds[1][n] (erc20)        |
                // *** may be optional depending on the size

                // Offset to the BasketTokens data
                let dataBegin := 168
                // Offset (O1) into the Token Contracts by type (2d array)
                let tokenContractsByTypeOffset := calldataload(dataBegin)
                // Offset (O2) into the Token Ids/Amounts by Token Type (2d array)
                let tokenIdsByTypeOffset := calldataload(add(dataBegin, 32))
                // TODO require this to be 2 (one each for ERC721/ERC20)
                let tokenContractsByTypeLength := calldataload(add(dataBegin, 64))
                let tokenIdsByTypeDataBegin := add(dataBegin, tokenIdsByTypeOffset)
                // TODO require this to be 2 (one each for ERC721/ERC20)
                let tokenIdsByTypeLength := calldataload(tokenIdsByTypeDataBegin)
                // ERC721 tokens length (B)
                let erc721ContractsLength := calldataload(add(dataBegin, 160))

                let currentTokenContractOffset := add(dataBegin, 192)
                let currentTokenIdOffset := add(tokenIdsByTypeDataBegin, 128)
                // let tokenTypeIdsLength := calldataload(add(tokenIdsByTypeDataBegin, 96))
                for {let i := 0} lt(i, erc721ContractsLength) {i := add(i, 1)} {
                    // Load the token contract
                    mstore(dataBegin, calldataload(currentTokenContractOffset))
                    // Load the token id
                    mstore(add(dataBegin, 32), calldataload(currentTokenIdOffset))
                    // increment
                    currentTokenContractOffset := add(currentTokenContractOffset, 32)
                    currentTokenIdOffset := add(currentTokenIdOffset, 32)
                    // TODO 232 != 260
                    let success := call(
                        gas,            // forward all gas
                        sload(ERC721_PROXY_slot),   // call address of token contract
                        0,              // don't send any ETH
                        0,              // pointer to start of input
                        260,            // length of input
                        0,              // write output to null
                        0               // output size is 0 bytes
                    )
                    // TODO check the return of call
                }
                // write transferFrom ERC20 assetDataLength 4+32 =36
                mstore(132, 0x0000000000000000000000000000000000000000000000000000000000000024)
                // Write ERC20 Proxy Id =
                mstore(164, 0xf47261b000000000000000000000000000000000000000000000000000000000)
                // Clear any remaining data from erc721
                mstore(add(dataBegin, 32), 0x0000000000000000000000000000000000000000000000000000000000000000)
                let erc20ContractsLength := calldataload(currentTokenContractOffset)
                currentTokenContractOffset := add(currentTokenContractOffset, 32)
                currentTokenIdOffset := add(currentTokenIdOffset, 32)
                for {let i := 0} lt(i, erc20ContractsLength) {i := add(i, 1)} {
                    // Load the token contract
                    mstore(dataBegin, calldataload(currentTokenContractOffset))
                    // Token amount is not after contract data with ERC20
                    mstore(100, calldataload(currentTokenIdOffset))
                    // increment
                    currentTokenContractOffset := add(currentTokenContractOffset, 32)
                    currentTokenIdOffset := add(currentTokenIdOffset, 32)
                    // TODO 228
                    let success := call(
                        gas,            // forward all gas
                        sload(ERC20_PROXY_slot),   // call address of token contract
                        0,              // don't send any ETH
                        0,              // pointer to start of input
                        228,            // length of input
                        0,              // write output to null
                        0               // output size is 0 bytes
                    )
                    // TODO check the return of call
                }
                return(0, 228)
                // return(0, 260)
                // return(0, 0)
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
