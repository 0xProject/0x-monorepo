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
    // solhint-disable var-name-mixedcase
    address internal ERC721_PROXY;
    address internal ERC20_PROXY;
    // solhint-enable var-name-mixedcase

    // Id of this proxy.
    // address[0] == ERC721, address[1] == ERC20
    // uint256[0] == ERC721 tokenIds, uint256[1] == ERC20 token amounts
    bytes4 constant internal PROXY_ID = bytes4(keccak256("BasketTokens(address[][],uint256[][])"));

    constructor(address erc721Proxy, address erc20Proxy)
        public
    {
        ERC721_PROXY = erc721Proxy;
        ERC20_PROXY = erc20Proxy;
    }

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
                // Asset function selector begins at 164 for 4 bytes
                // Asset data begins at offset 168
                // Asset data itself is encoded as follows:
                // | Area     | Offset     | Length  | Contents                            |
                // |----------|------------|---------|-------------------------------------|
                // | Header   | 0          | 4       | function selector                   |
                // | Params   |            |         | function parameters:                |
                // |          | 4          | 32      |   1.  contracts[][] offset (O1)     |
                // |          | 36         | 32      |   2.  tokenIds[][] offset  (O2)     |
                // |          | 68         | 32      |   3.  contracts length (A)          |
                // |          | 100        | 32      |   4.  contracts[0] offset           |
                // |          | 132        | 32      |   5.  contracts[1] offset           |
                // |   O1     | 164        | 32      |   6.  contracts[0].length (B1)      |
                // |   ***    | 164+B*32   | 32      |       contracts[0][n] (erc721)      |
                // |          |            | 32      |   7.  contracts[1].length (B2)      |
                // |   ***    |            | 32      |       contracts[1][n] (erc20)       |
                // |   O2     | O2         | 32      |   8.  tokenIds length (C)           |
                // |          | O2+32      | 32      |   9.  tokenIds[0] offset            |
                // |          | O2+64      | 32      |   10. tokenIds[1] offset            |
                // |          | O2+96      | 32      |   11. tokenIds[0].length (D1)       |
                // |   ***    | O2+128     | 32      |       tokenIds[0][n] (erc721)       |
                // |          | O2+160     | 32      |   12. tokenIds[1].length (D2)       |
                // |   ***    | O2+192     | 32      |       tokenIds[1][n] (erc20)        |
                // *** may be optional depending on the size

                // Offset to the BasketTokens data
                let dataBegin := 164
                // Offset (O1) into the Token Contracts by type (2d array)
                let tokenContractsByTypeOffset := calldataload(add(dataBegin, 4))
                // Offset (O2) into the Token Ids/Amounts by Token Type (2d array)
                let tokenIdsByTypeOffset := calldataload(add(dataBegin, 36))

                // Token Contract Addresses
                let tokenContractsByTypeLength := calldataload(add(dataBegin, 68))
                // Require this length to be 2 to avoid ambiguity
                // [[erc721], [erc20]]
                // [[erc721], []]
                // [[], [erc20]]
                if eq(eq(tokenContractsByTypeLength, 2), 0) {
                    // Revert with `Error("TRANSFER_FAILED")`
                    mstore(0, 0x08c379a000000000000000000000000000000000000000000000000000000000)
                    mstore(32, 0x0000002000000000000000000000000000000000000000000000000000000000)
                    mstore(64, 0x0000000f5452414e534645525f4641494c454400000000000000000000000000)
                    mstore(96, 0)
                    revert(0, 100)
                }
                // Token Ids or Amount
                let tokenIdsByTypeDataBegin := add(dataBegin, tokenIdsByTypeOffset)
                let tokenIdsByTypeLength := calldataload(add(tokenIdsByTypeDataBegin, 4))
                // Require this length to be 2 to avoid ambiguity
                // [[id], [amount]]
                // [[id], []]
                // [[], [amount]]
                if eq(eq(tokenIdsByTypeLength, 2), 0) {
                    // Revert with `Error("TRANSFER_FAILED")`
                    mstore(0, 0x08c379a000000000000000000000000000000000000000000000000000000000)
                    mstore(32, 0x0000002000000000000000000000000000000000000000000000000000000000)
                    mstore(64, 0x0000000f5452414e534645525f4641494c454400000000000000000000000000)
                    mstore(96, 0)
                    revert(0, 100)
                }
                // ERC721 tokens length (B)
                let erc721ContractsLength := calldataload(add(dataBegin, 164))
                // Id Data data begin: length, [0] offset, [1] offset, [0] length, [1] length
                let erc721IdsLength := calldataload(add(tokenIdsByTypeDataBegin, 100))
                // Ensure ERC721 Contract length == ERC721 token id length
                if eq(eq(erc721ContractsLength, erc721IdsLength), 0) {
                    // Revert with `Error("TRANSFER_FAILED")`
                    mstore(0, 0x08c379a000000000000000000000000000000000000000000000000000000000)
                    mstore(32, 0x0000002000000000000000000000000000000000000000000000000000000000)
                    mstore(64, 0x0000000f5452414e534645525f4641494c454400000000000000000000000000)
                    mstore(96, 0)
                    revert(0, 100)
                }

                let currentTokenContractOffset := add(dataBegin, 196)
                let currentTokenIdOffset := add(tokenIdsByTypeDataBegin, 132)

                // ERC721
                // write transferFrom ERC721 assetDataLength 4+32+32 = 68
                mstore(132, 0x0000000000000000000000000000000000000000000000000000000000000044)
                // Write ERC721 Proxy Id = 0x02571792
                mstore(dataBegin, 0x0257179200000000000000000000000000000000000000000000000000000000)
                // Transfer ERC721
                for {let i := 0} lt(i, erc721ContractsLength) {i := add(i, 1)} {
                    // Load the token contract
                    mstore(168, calldataload(currentTokenContractOffset))
                    // Load the token id
                    mstore(200, calldataload(currentTokenIdOffset))
                    // increment
                    currentTokenContractOffset := add(currentTokenContractOffset, 32)
                    currentTokenIdOffset := add(currentTokenIdOffset, 32)

                    /////// Call `proxy.transferFrom` using the calldata ///////
                    let success := call(
                        gas,            // forward all gas
                        sload(ERC721_PROXY_slot),   // call address of token contract
                        0,              // don't send any ETH
                        0,              // pointer to start of input
                        232,            // length of input
                        0,              // write output to null
                        0               // output size is 0 bytes
                    )
                    // Revert with `Error("TRANSFER_FAILED")`
                    if eq(success, 0) {
                        mstore(0, 0x08c379a000000000000000000000000000000000000000000000000000000000)
                        mstore(32, 0x0000002000000000000000000000000000000000000000000000000000000000)
                        mstore(64, 0x0000000f5452414e534645525f4641494c454400000000000000000000000000)
                        mstore(96, 0)
                        revert(0, 100)
                    }
                }
                // ERC20
                // write transferFrom ERC20 assetDataLength 4+32 =36
                mstore(132, 0x0000000000000000000000000000000000000000000000000000000000000024)
                // Write ERC20 Proxy Id = 0xf47261b0
                mstore(dataBegin, 0xf47261b000000000000000000000000000000000000000000000000000000000)
                // Clear any remaining data from erc721 token ids
                mstore(200, 0x0000000000000000000000000000000000000000000000000000000000000000)

                let erc20ContractsLength := calldataload(currentTokenContractOffset)
                let erc20AmountsLength := calldataload(currentTokenIdOffset)
                // Ensure ERC20 Contract length == amounts length
                if eq(eq(erc20ContractsLength, erc20AmountsLength), 0) {
                    // Revert with `Error("TRANSFER_FAILED")`
                    mstore(0, 0x08c379a000000000000000000000000000000000000000000000000000000000)
                    mstore(32, 0x0000002000000000000000000000000000000000000000000000000000000000)
                    mstore(64, 0x0000000f5452414e534645525f4641494c454400000000000000000000000000)
                    mstore(96, 0)
                    revert(0, 100)
                }

                currentTokenContractOffset := add(currentTokenContractOffset, 32)
                currentTokenIdOffset := add(currentTokenIdOffset, 32)
                // Transfer ERC20
                for {let i := 0} lt(i, erc20ContractsLength) {i := add(i, 1)} {
                    // Load the token contract
                    mstore(168, calldataload(currentTokenContractOffset))
                    // Token amount is in the transferFrom parameters for ERC20
                    mstore(100, calldataload(currentTokenIdOffset))
                    // increment
                    currentTokenContractOffset := add(currentTokenContractOffset, 32)
                    currentTokenIdOffset := add(currentTokenIdOffset, 32)

                    /////// Call `proxy.transferFrom` using the calldata ///////
                    let success := call(
                        gas,                       // forward all gas
                        sload(ERC20_PROXY_slot),   // call address of token contract
                        0,                         // don't send any ETH
                        0,                         // pointer to start of input
                        200,                       // length of input
                        0,                         // write output to null
                        0                          // output size is 0 bytes
                    )
                    if eq(success, 0) {
                        // Revert with `Error("TRANSFER_FAILED")`
                        mstore(0, 0x08c379a000000000000000000000000000000000000000000000000000000000)
                        mstore(32, 0x0000002000000000000000000000000000000000000000000000000000000000)
                        mstore(64, 0x0000000f5452414e534645525f4641494c454400000000000000000000000000)
                        mstore(96, 0)
                        revert(0, 100)
                    }
                }
                return(0, 0)
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

    // solhint-disable func-name-mixedcase
    function BasketTokens(address[][], uint256[][])
        public
    {
        return;
    }
    // solhint-enable func-name-mixedcase
}
