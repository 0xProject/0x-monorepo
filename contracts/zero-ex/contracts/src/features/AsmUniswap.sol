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

import "@0x/contracts-utils/contracts/src/v06/errors/LibRichErrorsV06.sol";
import "@0x/contracts-utils/contracts/src/v06/LibBytesV06.sol";
import "../errors/LibSignatureRichErrors.sol";
import "../fixins/FixinCommon.sol";
import "../migrations/LibMigrate.sol";
import "./ISignatureValidator.sol";
import "./IFeature.sol";


/// @dev Minima
contract AsmUniswapFeature is {

    address constant ALLOWANCE_TARGET = 0xF740B67dA229f2f10bcBd38A7979992fCC71B8Eb;

    // WETH-DAI
    address constant HAVE_TOKEN = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address constant WANT_TOKEN = 0x6B175474E89094C44Da98b954EedeAC495271d0F;

    // UniswapV2Pair for WETH-DAI
    address constant PAIR = 0xA478c2975Ab1Ea89e8196811F51A7B7Ade33eB11;

    // Selectors
    uint256 constant EXECUTE_CALL_SELECTOR = 
    0xbca8c7b500000000000000000000000000000000000000000000000000000000;
    uint256 constant GET_RESERVES_SELECTOR = 0x0902f1ac00000000000000000000000000000000000000000000000000000000;
    uint256 constant SWAP_SELECTOR = 0x022c0d9f00000000000000000000000000000000000000000000000000000000;

    // Implements ABI `uniswapWethDai(uint112 haveAmount)`
    fallback() external payable {
        assembly {
            // Call ALLOWANCE_TARGET.executeCall(HAVE_TOKEN,
            //  "transferFrom(msg.sender, PAIR, haveAmount)")
            // TODO: Use a big CODECOPY to create temple for all calls?
            mstore(0x00, EXECUTE_CALL_SELECTOR)
            mstore(0x04, HAVE_TOKEN)
            mstore(0x24, 0x40)
            mstore(0x44, 0x64)
            mstore(0x64, TRANSFER_FROM_SELECTOR)
            mstore(0x68, caller())
            mstore(0x88, PAIR)
            mstore(0xA8, calldataload(0x04)) // haveAmount
            call(
                gas(),
                ALLOWANCE_TARGET,
                0,
                0, 0xE4,
                0, 0
            )
            // No need to check result, if transfer failed the UniswapV2Pair will
            // reject our trade (or it may succeed if somehow the reserve was out of sync)
            // this is fine for the taker.

            // Call PAIR.getReserves()
            mstore(0x00, GET_RESERVES_SELECTOR)
            call(
                gas(),
                PAIR,
                0,
                0, 4,
                0, 0x40
            )
            // Call never fails (PAIR is trusted)
            // Results are in range (0, 2¹¹²) stored in:
            // wantReserve = mload(0x00)
            // haveReserve = mload(0x20)

            // Call PAIR.swap(wantAmount, 0, msg.sender, new bytes(0))
            mstore(0x00, SWAP_SELECTOR)
            mstore(0x04, div(
                mul(mul(calldataload(0x04), 997), mload(0x20)),
                add(mul(calldataload(0x04), 997), mul(mload(0x00), 1000))
            )
            mstore(0x24, 0)
            mstore(0x44, caller())
            mstore(0x64, 0x80)
            mstore(0x84, 0)
            call(
                gas(),
                PAIR,
                0,
                0, 0xA4,
                0, 0
            )
        }
    }
}
