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

    // WETH-DAI
    address constant WANT_TOKEN = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address constant HAVE_TOKEN = 0x6B175474E89094C44Da98b954EedeAC495271d0F;

    // UniswapV2Pair for WETH-DAI
    address constant PAIR = 0xA478c2975Ab1Ea89e8196811F51A7B7Ade33eB11;

    // Selectors
    uint256 constant EXECUTE_CALL_SELECTOR =
    0xbca8c7b500000000000000000000000000000000000000000000000000000000;
    uint256 constant GET_RESERVES_SELECTOR = 0x0902f1ac00000000000000000000000000000000000000000000000000000000;
    uint256 constant SWAP_SELECTOR = 0x022c0d9f00000000000000000000000000000000000000000000000000000000;
    uint256 constant TRANSFER_FROM_SELECTOR = 0x23b872dd00000000000000000000000000000000000000000000000000000000;

    // Implements ABI `uniswapWethDai(uint112 haveAmount)`
    fallback() external payable {
        assembly {
            // Call ALLOWANCE_TARGET.executeCall(HAVE_TOKEN,
            //  "transferFrom(msg.sender, PAIR, haveAmount)")
            // TODO: Use a big CODECOPY to create templates for all calls?
            mstore(0x00, TRANSFER_FROM_SELECTOR)
            mstore(0x04, caller())
            mstore(0x24, PAIR)
            mstore(0x44, calldataload(0x04)) // haveAmount
            let success := call(
                gas(),
                HAVE_TOKEN,
                0,
                0, 0x64,
                0, 0
            )
            if iszero(success) {
                returndatacopy(
                    0,                // copy to memory at 0
                    0,                // copy from return data at 0
                    returndatasize()  // copy all return data
                )
                revert(0, returndatasize())
            }
            // No need to check result, if transfer failed the UniswapV2Pair will
            // reject our trade (or it may succeed if somehow the reserve was out of sync)
            // this is fine for the taker.

            // Call PAIR.getReserves()
            mstore(0x00, GET_RESERVES_SELECTOR)
            success := call(
                gas(),
                PAIR,
                0,
                0, 4,
                0, 0x40
            )
            if iszero(success) {
                returndatacopy(
                    0,                // copy to memory at 0
                    0,                // copy from return data at 0
                    returndatasize()  // copy all return data
                )
                revert(0, returndatasize())
            }
            // Call never fails (PAIR is trusted)
            // Results are in range (0, 2¹¹²) stored in:
            // Call PAIR.swap(0, wantAmount, msg.sender, new bytes(0))
            let haveAmountWithFee := mul(calldataload(0x04), 997)
            mstore(0x40, SWAP_SELECTOR)
            mstore(0x44, 0)
            mstore(0x64, div(
                mul(haveAmountWithFee, mload(0x20)),
                add(haveAmountWithFee, mul(mload(0x00), 1000))
            ))
            mstore(0x84, caller())
            mstore(0xA4, 0x80)
            mstore(0xC4, 0)
            success := call(
                gas(),
                PAIR,
                0,
                0x40, 0xA4,
                0, 0
            )
            if success {
                return(0, 0)
            }
            returndatacopy(
                0,                // copy to memory at 0
                0,                // copy from return data at 0
                returndatasize()  // copy all return data
            )
            revert(0, returndatasize())
        }
    }
    function dummy() external {}
}
