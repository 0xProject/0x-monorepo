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

pragma solidity ^0.5.9;
pragma experimental ABIEncoderV2;

import "@0x/contracts-erc20/contracts/src/interfaces/IERC20Token.sol";
import "@0x/contracts-erc20/contracts/src/interfaces/IEtherToken.sol";
import "@0x/contracts-erc20/contracts/src/LibERC20Token.sol";
import "@0x/contracts-exchange-libs/contracts/src/IWallet.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";
import "@0x/contracts-utils/contracts/src/DeploymentConstants.sol";
import "../interfaces/IERC20Bridge.sol";


// solhint-disable space-after-comma
// solhint-disable not-rely-on-time
contract RitualBridge is
    IERC20Bridge,
    IWallet,
    DeploymentConstants
{
    uint256 public constant BUY_WINDOW_LENGTH = 24 hours;
    uint256 public constant MIN_INTERVAL_LENGTH = 24 hours;

    struct RecurringBuyParams {
        uint256 sellAmount;
        uint256 interval;
        uint256 minBuyAmount;
        uint256 maxSlippageBps;
        uint256 currentBuyWindowStart;
        uint256 currentIntervalAmountSold;
    }

    mapping (bytes32 => RecurringBuyParams) public recurringBuys;

    function ()
        external
        payable
    {}

    /// @dev Callback for `IERC20Bridge`. Tries to buy `makerAssetAmount` of
    ///      `makerToken` by selling the entirety of the `takerToken`
    ///      encoded in the bridge data.
    /// @param makerToken The token to buy and transfer to `to`.
    /// @param taker The recipient of the bought tokens.
    /// @param makerAssetAmount Minimum amount of `makerToken` to buy.
    /// @param bridgeData ABI-encoded addresses of the taker token and
    ///        recurring buyer for whom the bridge order was created.
    /// @return success The magic bytes if successful.
    function bridgeTransferFrom(
        address makerToken,
        address /* maker */,
        address taker,
        uint256 makerAssetAmount,
        bytes calldata bridgeData
    )
        external
        returns (bytes4 success)
    {}

    /// @dev `SignatureType.Wallet` callback, so that this bridge can be the maker
    ///      and sign for itself in orders. Always succeeds.
    /// @return magicValue Success bytes, always.
    function isValidSignature(
        bytes32,
        bytes calldata
    )
        external
        view
        returns (bytes4 magicValue)
    {
        return LEGACY_WALLET_MAGIC_VALUE;
    }

    function setRecurringBuy(
        address sellToken,
        address buyToken,
        uint256 sellAmount,
        uint256 interval,
        uint256 minBuyAmount,
        uint256 maxSlippageBps,
        LibOrder.Order[] memory orders,
        bytes[] memory signatures
    )
        external
        returns (bytes32 recurringBuyID, uint256 amountBought)
    {}

    function cancelRecurringBuy(
        address sellToken,
        address buyToken
    )
        external
    {}

    function flashArbitrage(
        address recipient,
        address sellToken,
        address buyToken
    )
        external
        returns (uint256 amountBought)
    {}

    function _validateAndGetParams(
        uint256 takerAssetAmount,
        uint256 makerAssetAmount,
        address recurringBuyer,
        address takerToken,
        address makerToken
    )
        private
        returns (RecurringBuyParams memory params)
    {}
}
