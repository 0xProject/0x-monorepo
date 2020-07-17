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

pragma solidity ^0.5.16;
pragma experimental ABIEncoderV2;

import "@0x/contracts-erc20/contracts/src/interfaces/IEtherToken.sol";
import "@0x/contracts-erc20/contracts/src/LibERC20Token.sol";
import "@0x/contracts-exchange/contracts/src/interfaces/IExchange.sol";
import "@0x/contracts-exchange-libs/contracts/src/IWallet.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibMath.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";
import "@0x/contracts-utils/contracts/src/DeploymentConstants.sol";
import "@0x/contracts-utils/contracts/src/LibSafeMath.sol";
import "@0x/contracts-utils/contracts/src/Refundable.sol";
import "../interfaces/IChainlinkOracle.sol";
import "../interfaces/IERC20Bridge.sol";
import "../interfaces/IAssetData.sol";


// solhint-disable space-after-comma
// solhint-disable not-rely-on-time
contract RitualBridge is
    IERC20Bridge,
    IWallet,
    Refundable,
    DeploymentConstants
{
    using LibSafeMath for uint256;

    struct RecurringBuy {
        uint256 sellAmount;
        uint256 interval;
        uint256 minBuyAmount;
        uint256 maxSlippageBps;
        uint256 currentBuyWindowStart;
        uint256 currentIntervalAmountSold;
        /* address chainlinkOracle;
        bool invertOraclePrice; */
        bool unwrapWeth;
    }

    uint256 public constant BUY_WINDOW_LENGTH = 24 hours;
    uint256 public constant MIN_INTERVAL_LENGTH = 24 hours;

    mapping (bytes32 => RecurringBuy) public recurringBuys;

    // solhint-disable var-name-mixedcase
    IExchange internal EXCHANGE;
    address internal ERC20_PROXY;
    // solhint-enable var-name-mixedcase

    function ()
        external
        payable
    {}

    constructor (address _exchange)
        public
    {
        EXCHANGE = IExchange(_exchange);
        ERC20_PROXY = EXCHANGE.getAssetProxy(IAssetData(address(0)).ERC20Token.selector);
    }

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
    {
        (
            address takerToken,
            address recurringBuyer
        ) = abi.decode(
            bridgeData,
            (address, address)
        );

        uint256 takerAssetAmount = LibERC20Token.balanceOf(
            takerToken,
            address(this)
        );

        bool unwrapWeth = _validateAndUpdateRecurringBuy(
            takerAssetAmount,
            makerAssetAmount,
            recurringBuyer,
            takerToken,
            makerToken
        );

        if (unwrapWeth) {
            IEtherToken(takerToken).withdraw(takerAssetAmount);
            address payable recurringBuyerPayable = address(uint160(recurringBuyer));
            recurringBuyerPayable.transfer(takerAssetAmount);
        } else {
            LibERC20Token.transfer(
                takerToken,
                recurringBuyer,
                takerAssetAmount
            );
        }

        LibERC20Token.transferFrom(
            makerToken,
            recurringBuyer,
            taker,
            makerAssetAmount
        );

        return BRIDGE_SUCCESS;
    }

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
        bool unwrapWeth,
        LibOrder.Order[] memory orders,
        bytes[] memory signatures
    )
        public
        payable
        refundFinalBalance
        returns (bytes32 recurringBuyID, uint256 amountBought)
    {
        require(
            interval >= MIN_INTERVAL_LENGTH,
            "RitualBridge::setRecurringBuy/INTERVAL_TOO_SHORT"
        );
        require(
            sellToken != buyToken,
            "RitualBridge::setRecurringBuy/INVALID_TOKEN_PAIR"
        );

        recurringBuyID = keccak256(abi.encode(
            msg.sender,
            sellToken,
            buyToken
        ));

        uint256 amountSold;
        if (orders.length > 0) {
            (amountSold, amountBought) = _initialMarketSell(
                sellToken,
                buyToken,
                sellAmount,
                orders,
                signatures,
                unwrapWeth
            );
        }

        recurringBuys[recurringBuyID] = RecurringBuy({
            sellAmount: sellAmount,
            interval: interval,
            minBuyAmount: minBuyAmount,
            maxSlippageBps: maxSlippageBps,
            currentBuyWindowStart: block.timestamp,
            currentIntervalAmountSold: amountSold,
            unwrapWeth: unwrapWeth
        });
    }

    function cancelRecurringBuy(
        address sellToken,
        address buyToken
    )
        external
    {
        bytes32 recurringBuyID = _calculateRecurringBuyID(
            msg.sender,
            sellToken,
            buyToken
        );
        delete recurringBuys[recurringBuyID];
    }

    function fillRecurringBuy(
        address recurringBuyer,
        address sellToken,
        address buyToken,
        LibOrder.Order[] memory orders,
        bytes[] memory signatures
    )
        public
        payable
        returns (uint256 amountSold, uint256 amountBought)
    {
        bytes32 recurringBuyID = _calculateRecurringBuyID(
            recurringBuyer,
            sellToken,
            buyToken
        );
        RecurringBuy memory buyState = recurringBuys[recurringBuyID];

        require(
            buyState.sellAmount > 0,
            "RitualBridge::fillRecurringBuy/NO_ACTIVE_RECURRING_BUY_FOUND"
        );

        uint256 sellAmount;
        if (block.timestamp < buyState.currentBuyWindowStart.safeAdd(BUY_WINDOW_LENGTH)) {
            sellAmount = buyState.sellAmount.safeSub(buyState.currentIntervalAmountSold);
            recurringBuys[recurringBuyID].currentIntervalAmountSold = buyState.currentIntervalAmountSold.safeAdd(sellAmount);
        } else {
            uint256 timeSinceBuyWindowStart = block.timestamp
                .safeSub(buyState.currentBuyWindowStart) % buyState.interval;
            require(
                timeSinceBuyWindowStart < BUY_WINDOW_LENGTH,
                "RitualBridge::fillRecurringBuy/OUTSIDE_OF_BUY_WINDOW"
            );
            sellAmount = buyState.sellAmount;
            recurringBuys[recurringBuyID].currentBuyWindowStart = block.timestamp.safeSub(timeSinceBuyWindowStart);
            recurringBuys[recurringBuyID].currentIntervalAmountSold = sellAmount;
        }

        (amountSold, amountBought) = _marketSell(
            recurringBuyer,
            sellToken,
            buyToken,
            sellAmount,
            orders,
            signatures
        );

        uint256 minBuyAmountScaled = LibMath.safeGetPartialAmountFloor(
            sellAmount,
            buyState.sellAmount,
            buyState.minBuyAmount
        );
        require(
            amountBought >= minBuyAmountScaled,
            "RitualBridge::fillRecurringBuy/INVALID_PRICE"
        );

        if (buyToken == _getWethAddress() && buyState.unwrapWeth) {
            IEtherToken(buyToken).withdraw(amountBought);
            address payable recurringBuyerPayable = address(uint160(recurringBuyer));
            recurringBuyerPayable.transfer(amountBought);
        } else {
            LibERC20Token.transfer(
                buyToken,
                recurringBuyer,
                amountBought
            );
        }

        return (amountSold, amountBought);
    }

    function getFillableMakerAssetAmount(
        address recurringBuyer,
        address makerToken,
        address takerToken
    )
        external
        view
        returns (uint256 fillableMakerAssetAmount)
    {
        bytes32 recurringBuyID = keccak256(abi.encode(
            recurringBuyer,
            makerToken,
            takerToken
        ));

        RecurringBuy memory buyState = recurringBuys[recurringBuyID];
        if (buyState.sellAmount == 0) {
            return 0;
        }
        if (block.timestamp < buyState.currentBuyWindowStart.safeAdd(BUY_WINDOW_LENGTH)) {
            fillableMakerAssetAmount = buyState.sellAmount
                .safeSub(buyState.currentIntervalAmountSold);
        } else if (block.timestamp.safeSub(buyState.currentBuyWindowStart) % buyState.interval < BUY_WINDOW_LENGTH) {
            fillableMakerAssetAmount = buyState.sellAmount;
        } else {
            return 0;
        }
        fillableMakerAssetAmount = LibSafeMath.min256(
            LibERC20Token.balanceOf(makerToken, recurringBuyer),
            fillableMakerAssetAmount
        );
        fillableMakerAssetAmount = LibSafeMath.min256(
            LibERC20Token.allowance(makerToken, recurringBuyer, address(this)),
            fillableMakerAssetAmount
        );

        return fillableMakerAssetAmount;
    }

    function _validateAndUpdateRecurringBuy(
        uint256 takerAssetAmount,
        uint256 makerAssetAmount,
        address recurringBuyer,
        address takerToken,
        address makerToken
    )
        private
        returns (bool unwrapWeth)
    {
        bytes32 recurringBuyID = _calculateRecurringBuyID(
            recurringBuyer,
            makerToken,
            takerToken
        );

        RecurringBuy memory buyState = recurringBuys[recurringBuyID];

        require(
            buyState.sellAmount > 0,
            "RitualBridge::_validateAndUpdateRecurringBuy/NO_ACTIVE_RECURRING_BUY_FOUND"
        );

        uint256 minBuyAmountScaled = LibMath.safeGetPartialAmountFloor(
            makerAssetAmount,
            buyState.sellAmount,
            buyState.minBuyAmount
        );

        require(
            takerAssetAmount >= minBuyAmountScaled,
            "RitualBridge::_validateAndUpdateRecurringBuy/INVALID_PRICE"
        );

        if (block.timestamp < buyState.currentBuyWindowStart.safeAdd(BUY_WINDOW_LENGTH)) {
            require(
                buyState.currentIntervalAmountSold.safeAdd(makerAssetAmount) <= buyState.sellAmount,
                "RitualBridge::_validateAndUpdateRecurringBuy/EXCEEDS_SELL_AMOUNT"
            );

            recurringBuys[recurringBuyID].currentIntervalAmountSold = buyState.currentIntervalAmountSold
                .safeAdd(makerAssetAmount);
        } else {
            uint256 timeSinceBuyWindowStart = block.timestamp
                .safeSub(buyState.currentBuyWindowStart) % buyState.interval;
            require(
                timeSinceBuyWindowStart < BUY_WINDOW_LENGTH,
                "RitualBridge::_validateAndUpdateRecurringBuy/OUTSIDE_OF_BUY_WINDOW"
            );
            require(
                makerAssetAmount <= buyState.sellAmount,
                "RitualBridge::_validateAndUpdateRecurringBuy/EXCEEDS_SELL_AMOUNT"
            );
            recurringBuys[recurringBuyID].currentBuyWindowStart = block.timestamp.safeSub(timeSinceBuyWindowStart);
            recurringBuys[recurringBuyID].currentIntervalAmountSold = makerAssetAmount;
        }

        if (takerToken == _getWethAddress() && buyState.unwrapWeth) {
            return true;
        } else {
            return false;
        }
    }

    function _initialMarketSell(
        address sellToken,
        address buyToken,
        uint256 sellAmount,
        LibOrder.Order[] memory orders,
        bytes[] memory signatures,
        bool unwrapWeth
    )
        private
        returns (uint256 amountSold, uint256 amountBought)
    {
        (amountSold, amountBought) = _marketSell(
            msg.sender,
            sellToken,
            buyToken,
            sellAmount,
            orders,
            signatures
        );
        if (amountBought == 0) {
            return (amountSold, amountBought);
        }

        if (unwrapWeth && buyToken == _getWethAddress()) {
            IEtherToken(buyToken).withdraw(amountBought);
            // The `refundFinalBalance` modifier will handle the transfer.
        } else {
            LibERC20Token.transfer(
                buyToken,
                msg.sender,
                amountBought
            );
        }
    }

    function _marketSell(
        address recurringBuyer,
        address sellToken,
        address buyToken,
        uint256 sellAmount,
        LibOrder.Order[] memory orders,
        bytes[] memory signatures
    )
        private
        returns (uint256 amountSold, uint256 amountBought)
    {
        LibERC20Token.transferFrom(
            sellToken,
            recurringBuyer,
            address(this),
            sellAmount
        );
        uint256 sellTokenBalance = LibERC20Token.balanceOf(sellToken, address(this));
        LibERC20Token.approveIfBelow(
            sellToken,
            ERC20_PROXY,
            sellAmount
        );

        EXCHANGE.marketSellOrdersNoThrow.value(msg.value)(
            orders,
            sellAmount,
            signatures
        );

        uint256 sellTokenRemaining = LibERC20Token.balanceOf(sellToken, address(this));
        LibERC20Token.transfer(
            sellToken,
            recurringBuyer,
            sellTokenRemaining
        );

        amountSold = sellTokenBalance.safeSub(sellTokenRemaining);
        amountBought = LibERC20Token.balanceOf(buyToken, address(this));
        return (amountSold, amountBought);
    }

    function _calculateRecurringBuyID(
        address buyer,
        address sellToken,
        address buyToken
    )
        private
        pure
        returns (bytes32)
    {
        return keccak256(abi.encode(
            buyer,
            sellToken,
            buyToken
        ));
    }
}
