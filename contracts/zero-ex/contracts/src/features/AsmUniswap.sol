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
pragma experimental ABIEncoderV2;


contract AsmUniswap {

    address constant ALLOWANCE_TARGET = 0xF740B67dA229f2f10bcBd38A7979992fCC71B8Eb;

    // UniswapV2Factory
    uint256 constant FF_FACTORY = 0xFF5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f0000000000000000000000;
    uint256 constant CODE_HASH = 0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f;
    uint256 constant ADDRESS_MASK = 0x000000000000000000000000ffffffffffffffffffffffffffffffffffffffff;
 
    // Selectors
    uint256 constant EXECUTE_CALL_SELECTOR =
    0xbca8c7b500000000000000000000000000000000000000000000000000000000;
    uint256 constant GET_RESERVES_SELECTOR = 0x0902f1ac00000000000000000000000000000000000000000000000000000000;
    uint256 constant SWAP_SELECTOR = 0x022c0d9f00000000000000000000000000000000000000000000000000000000;
    uint256 constant TRANSFER_FROM_SELECTOR = 0x23b872dd00000000000000000000000000000000000000000000000000000000;

    // Implements ABI `uniswap(address to, address haveToken,
    //     address wantToken, uint256 haveAmount)`
    fallback() external payable {
        assembly {
            let to := calldataload(0x04)
            let haveToken := calldataload(0x24)
            let wantToken := calldataload(0x44)
            let haveAmount := calldataload(0x64)
            let order := lt(haveToken, wantToken)

            // Compute the UniswapV2Pair address
            switch order
            case 0 {
                mstore(0x00, wantToken)
                mstore(0x20, haveToken)
            }
            default {
                mstore(0x00, haveToken)
                mstore(0x20, wantToken)
            }
            let salt := keccak256(0x00, 0x40)
            mstore(0x00, FF_FACTORY)
            mstore(0x15, salt)
            mstore(0x35, CODE_HASH)
            let pair := and(ADDRESS_MASK, keccak256(0, 0x55))
            // TODO: Fix pair computation
            pair := 0xA478c2975Ab1Ea89e8196811F51A7B7Ade33eB11

            // Call ALLOWANCE_TARGET.executeCall(HAVE_TOKEN,
            //  "transferFrom(msg.sender, PAIR, haveAmount)")
            // TODO: Use a big CODECOPY to create templates for all calls?
            mstore(0x00, EXECUTE_CALL_SELECTOR)
            mstore(0x04, haveToken)
            mstore(0x24, 0x40)
            mstore(0x44, 0x64)
            mstore(0x64, TRANSFER_FROM_SELECTOR)
            mstore(0x68, caller()) 
            mstore(0x88, pair)
            mstore(0xA8, haveAmount)
            if iszero(call(gas(), ALLOWANCE_TARGET, 0, 0, 0xE4, 0, 0)) {
                bubbleRevert()
            }
            // No need to check result, if transfer failed the UniswapV2Pair will
            // reject our trade (or it may succeed if somehow the reserve was out of sync)
            // this is fine for the taker.

            // Call PAIR.getReserves()
            // Call never fails (PAIR is trusted)
            // Results are in range (0, 2¹¹²) stored in:
            // haveToken = mload(0x00)
            // wantToken = mload(0x20)
            mstore(0x00, GET_RESERVES_SELECTOR)
            if iszero(call(gas(), pair, 0, 0, 4, 0, 0x40)) {
                bubbleRevert()
            }

            // Call PAIR.swap(0, wantAmount, to, new bytes(0))
            let haveAmountWithFee := mul(haveAmount, 997)
            mstore(0x40, SWAP_SELECTOR)
            switch order
            case 0 {
                mstore(0x44, div(
                    mul(haveAmountWithFee, mload(0x00)),
                    add(haveAmountWithFee, mul(mload(0x20), 1000))
                ))
                mstore(0x64, 0)
            }
            default {
                mstore(0x44, 0)
                mstore(0x64, div(
                    mul(haveAmountWithFee, mload(0x20)),
                    add(haveAmountWithFee, mul(mload(0x00), 1000))
                ))
            }
            mstore(0x84, to)
            mstore(0xA4, 0x80)
            mstore(0xC4, 0)
            if iszero(call(gas(), pair, 0, 0x40, 0xF4, 0, 0)) {
                bubbleRevert()
            }
            stop()

            function bubbleRevert() {
                returndatacopy(0, 0, returndatasize())
                revert(0, returndatasize())
            }
        }
    }
    function dummy() external {}
}
