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

    address constant ALLOWANCE_TARGET = 0x5c69bee701ef814a2b6a3edd4b1652cb9cc5aa6f;

    // WETH-DAI
    address constant HAVE_TOKEN = 0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2;
    address constant WANT_TOKEN = 0x6b175474e89094c44da98b954eedeac495271d0f;

    // UniswapV2Pair for WETH-DAI
    address constant PAIR = 0x5c69bee701ef814a2b6a3edd4b1652cb9cc5aa6f;

    // Implements ABI `uniswapWethDai(uint112 haveAmount)`
    fallback() external payable {
        assembly {
            // Call ALLOWANCE_TARGET.executeCall(HAVE_TOKEN,
            //  "transferFrom(msg.sender, PAIR, haveAmount)")
            // TODO: Use a big CODECOPY to create temple for all calls?
            mstore(0x00, EXECUTE_CALL_SELECTOR)
            mstore(0x04, HAVE_TOKEN)
            mstore(0x24, 0x40)
            mstore(0x24, 0) // TODO: transfer from length 
            mstore(0x44, TRANSFER_FROM_SELECTOR)
            mstore(0x68, caller())
            mstore(0x88, PAIR)
            mstore(0xA8, calldataload(0x04)) // haveAmount
            call(
                gas(),
                ALLOWANCE_TARGET,
                0,
                0, 0xB8
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
                0, 4
                0, 0x40
            )
            // Call can not fail (PAIR is trusted)

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
                0, 0xA4
                0, 0
            )
        }
    }

}
