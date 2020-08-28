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
contract SignatureValidator is
    IFeature,
    ISignatureValidator,
    FixinCommon
{
    // Address of the `UniswapV2Factory`. It is used to derive addresses
    // of `UniswapV2Pair` instances.
    // TODO: Needs to change for testing.
    address constant FACTORY = 0x5c69bee701ef814a2b6a3edd4b1652cb9cc5aa6f;

    /// @dev Convert `haveAmount` of `haveToken` from `from` into `wantToken` and transfer to `to`.
    function uniswap(
        address from,
        address to,
        address haveToken,
        address wantToken,
        uint256 haveAmount
    ) {
        // Uniswap requires amounts less than 2¹¹².
        assert(haveAmount < 2**112);

        // Compute the UniswapV2Pair address
        IUniswapV2Pair pair = IUniswapV2Pair(address(
            uint256(keccak256(abi.encodePacked(
                hex"ff",
                FACTORY,
                keccak256(abi.encodePacked(
                    min(haveToken, wantToken),
                    max(haveToken, wantToken)
                )),
                // init code hash
                hex"96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f"
            )))
        ));

        // Transfer tokens to the UniswapV2Pair contract
        // Note: This doesn't affect the pair's reserve amounts.
        // Note: This is simplified, add error handling!
        // TODO: Use AllowanceTarget directly.
        IERC20(haveToken).transferFrom(from, pair, haveAmount);

        // Compute `wantAmount` and call pair contract for swap
        // Formula from `UniswapV2Library.getAmountOut`
        // <https://github.com/Uniswap/uniswap-v2-periphery/blob/master/contracts/libraries/UniswapV2Library.sol#L43>
        // TODO: Compare above formula with the assertion in `UniswapV2Pair.swap`
        // <https://github.com/Uniswap/uniswap-v2-core/blob/master/contracts/UniswapV2Pair.sol#L179>
        if (haveToken < wantToken) {
            (uint256 haveReserve, uint256 wantReserve, ) = pair.getReserve();
            // Uniswap reserves are 0 < x < 2¹¹² so math below can not
            // overflow or divide by zero.
            uint256 wantAmount = (haveAmount * wantReserve * 997) /
                (haveReserve * 1000 + haveAmount * 997);
            // Call fails if the pair does not exist.
            pair.swap(0, wantAmount, to, new bytes(0));
        } else {
            (uint256 wantReserve, uint256 haveReserve, ) = pair.getReserve();
            uint256 wantAmount = (haveAmount * wantReserve * 997) /
                (haveReserve * 1000 + haveAmount * 997);
            pair.swap(wantAmount, 0, to, new bytes(0));
        }
    }
}
