/*

    Copyright 2019 dYdX Trading Inc.

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

pragma solidity 0.5.9;
pragma experimental ABIEncoderV2;

import { SafeMath } from "./libs/SafeMath.sol";
import { IExchange } from "@0x/contracts-exchange/contracts/src/interfaces/IExchange.sol";
import { LibFillResults } from "@0x/contracts-exchange-libs/contracts/src/LibFillResults.sol";
import { LibOrder } from "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";
import { ExchangeWrapper } from "./interfaces/ExchangeWrapper.sol";
import { AdvancedTokenInteract } from "./libs/AdvancedTokenInteract.sol";
import { MathHelpers } from "./libs/MathHelpers.sol";
import { TokenInteract } from "./libs/TokenInteract.sol";


/**
 * @title ZeroExV3MultiOrderExchangeWrapper
 * @author dYdX/0x
 *
 * dYdX ExchangeWrapper to interface with 0x Version 3. Sends multiple orders at once. Assumes no
 * maker/taker fees.
 */
contract ZeroExV3MultiOrderExchangeWrapper is
    ExchangeWrapper
{
    using SafeMath for uint256;
    using TokenInteract for address;
    using AdvancedTokenInteract for address;

    // ============ Constants ============

    // number of bytes in the maxPrice data
    uint256 constant PRICE_DATA_LENGTH = 64;

    // number of bytes per (order + signature)
    uint256 constant ORDER_DATA_LENGTH = 322;

    // maximum gas price, 30 Gwei (choose value for deployment)
    uint256 constant MAX_GAS_PRICE = 30000000000 wei;

    // ============ Structs ============

    struct TokenAmounts {
        uint256 takerAmount;
        uint256 makerAmount;
    }

    struct TokenBalance {
        address owner;
        uint256 balance;
    }

    // ============ State Variables ============

    // msg.senders that will use this contract's WETH balance to pay protocol fees
    mapping (address => bool) public TRUSTED_MSG_SENDER;

    // address of the ZeroEx V3 Exchange
    address public ZERO_EX_EXCHANGE;

    // address of the ZeroEx ERC20Proxy
    address public ZERO_EX_TOKEN_PROXY;

    // address of the WETH token contract
    address public WETH_TOKEN;

    // ============ Constructor ============

    constructor(
        address zeroExExchange,
        address zeroExProxy,
        address weth,
        address[] memory trustedMsgSenders
    )
        public
    {
        ZERO_EX_EXCHANGE = zeroExExchange;
        ZERO_EX_TOKEN_PROXY = zeroExProxy;
        WETH_TOKEN = weth;

        for (uint256 i = 0; i < trustedMsgSenders.length; i++) {
            TRUSTED_MSG_SENDER[trustedMsgSenders[i]] = true;
        }
    }

    // ============ Public Functions ============

    /**
     * Exchange some amount of takerToken for makerToken.
     *
     * @param  receiver             Address to set allowance on once the trade has completed
     * @param  makerToken           Address of makerToken, the token to receive
     * @param  takerToken           Address of takerToken, the token to pay
     * @param  requestedFillAmount  Amount of takerToken being paid
     * @param  orderData            Arbitrary bytes data for any information to pass to the exchange
     * @return                      The amount of makerToken received
     */
    function exchange(
        address /* tradeOriginator */,
        address receiver,
        address makerToken,
        address takerToken,
        uint256 requestedFillAmount,
        bytes calldata orderData
    )
        external
        returns (uint256)
    {
        // parse all order data
        validateOrderData(orderData);
        TokenAmounts memory priceRatio = parseMaxPriceRatio(orderData);
        LibOrder.Order[] memory orders = parseOrders(orderData, makerToken, takerToken);
        bytes[] memory signatures = parseSignatures(orderData);

        // ensure that the 0x exchange can take the takerTokens from this contract
        takerToken.ensureAllowance(ZERO_EX_TOKEN_PROXY, requestedFillAmount);

        // make sure that the protocol fee collector can take WETH from this contract
        IExchange v3Exchange = IExchange(ZERO_EX_EXCHANGE);
        address protocolFeeCollector = v3Exchange.protocolFeeCollector();
        if (protocolFeeCollector != address(0)) {
            WETH_TOKEN.ensureAllowance(
                protocolFeeCollector,
                MathHelpers.maxUint256()
            );
        }

        // do the exchange
        LibFillResults.FillResults memory totalFillResults = v3Exchange.marketSellOrdersNoThrow(
            orders,
            requestedFillAmount,
            signatures
        );

        // validate that all taker tokens were sold
        require(
            totalFillResults.takerAssetFilledAmount == requestedFillAmount,
            "ZeroExV3MultiOrderExchangeWrapper#exchange: Cannot sell enough taker token"
        );

        // validate that max price is not violated
        validateTradePrice(
            priceRatio,
            totalFillResults.takerAssetFilledAmount,
            totalFillResults.makerAssetFilledAmount
        );

        // validate protocol fee
        validateProtocolFee(totalFillResults.protocolFeePaid);

        // ensure that the caller can take the makerTokens from this contract
        makerToken.ensureAllowance(receiver, totalFillResults.makerAssetFilledAmount);

        return totalFillResults.makerAssetFilledAmount;
    }

    /**
     * Get amount of takerToken required to buy a certain amount of makerToken for a given trade.
     * Should match the takerToken amount used in exchangeForAmount. If the order cannot provide
     * exactly desiredMakerToken, then it must return the price to buy the minimum amount greater
     * than desiredMakerToken
     *
     * @param  makerToken         Address of makerToken, the token to receive
     * @param  takerToken         Address of takerToken, the token to pay
     * @param  desiredMakerToken  Amount of makerToken requested
     * @param  orderData          Arbitrary bytes data for any information to pass to the exchange
     * @return                    Amount of takerToken the needed to complete the transaction
     */
    function getExchangeCost(
        address makerToken,
        address takerToken,
        uint256 desiredMakerToken,
        bytes calldata orderData
    )
        external
        view
        returns (uint256)
    {
        // parse all orders
        validateOrderData(orderData);
        TokenAmounts memory priceRatio = parseMaxPriceRatio(orderData);
        LibOrder.Order[] memory orders = parseOrders(orderData, makerToken, takerToken);

        // keep running count of how much takerToken is needed until desiredMakerToken is acquired
        TokenAmounts memory total;
        total.takerAmount = 0;
        total.makerAmount = desiredMakerToken;

        // gets the exchange cost. modifies total
        uint256 takerCost = getExchangeCostInternal(
            makerToken,
            orders,
            total
        );

        // validate that max price will not be violated
        validateTradePrice(priceRatio, takerCost, desiredMakerToken);

        // return the amount of taker token needed
        return takerCost;
    }

    // ============ Private Functions ============

    /**
     * Gets the amount of takerToken required to fill the amount of total.makerToken.
     * Does not return a value, only modifies the values inside total.
     */
    function getExchangeCostInternal(
        address makerToken,
        LibOrder.Order[] memory orders,
        TokenAmounts memory total
    )
        private
        view
        returns (uint256)
    {
        // read exchange address from storage
        IExchange zeroExExchange = IExchange(ZERO_EX_EXCHANGE);

        // cache balances for makers
        TokenBalance[] memory balances = new TokenBalance[](orders.length);

        // for all orders
        for (uint256 i = 0; i < orders.length && total.makerAmount != 0; i++) {
            LibOrder.Order memory order = orders[i];

            // get order info
            LibOrder.OrderInfo memory info = zeroExExchange.getOrderInfo(order);

            // ignore unfillable orders
            if (info.orderStatus != uint8(LibOrder.OrderStatus.FILLABLE)) {
                continue;
            }

            // calculate the remaining available taker and maker amounts in the order
            TokenAmounts memory available;
            available.takerAmount = order.takerAssetAmount.sub(info.orderTakerAssetFilledAmount);
            available.makerAmount = MathHelpers.getPartialAmount(
                available.takerAmount,
                order.takerAssetAmount,
                order.makerAssetAmount
            );

            // bound the remaining available amounts by the maker amount still needed
            if (available.makerAmount > total.makerAmount) {
                available.makerAmount = total.makerAmount;
                available.takerAmount = MathHelpers.getPartialAmountRoundedUp(
                    order.takerAssetAmount,
                    order.makerAssetAmount,
                    available.makerAmount
                );
            }

            // ignore orders that the maker will not be able to fill
            if (!makerHasEnoughTokens(
                makerToken,
                balances,
                order.makerAddress,
                available.makerAmount)
            ) {
                continue;
            }

            // update the running tallies
            total.takerAmount = total.takerAmount.add(available.takerAmount);
            total.makerAmount = total.makerAmount.sub(available.makerAmount);
        }

        // require that entire amount was bought
        require(
            total.makerAmount == 0,
            "ZeroExV3MultiOrderExchangeWrapper#getExchangeCostInternal: Cannot buy enough maker token"
        );

        return total.takerAmount;
    }

    /**
     * Checks and modifies balances to keep track of the expected balance of the maker after filling
     * each order. Returns true if the maker has enough makerToken left to transfer amount.
     */
    function makerHasEnoughTokens(
        address makerToken,
        TokenBalance[] memory balances,
        address makerAddress,
        uint256 amount
    )
        private
        view
        returns (bool)
    {
        // find the maker's balance in the cache or the first non-populated balance in the cache
        TokenBalance memory current;
        uint256 i;
        for (i = 0; i < balances.length; i++) {
            current = balances[i];
            if (
                current.owner == address(0)
                || current.owner == makerAddress
            ) {
                break;
            }
        }

        // if the maker is already in the cache
        if (current.owner == makerAddress) {
            if (current.balance >= amount) {
                current.balance = current.balance.sub(amount);
                return true;
            } else {
                return false;
            }
        }

        // if the maker is not already in the cache
        else {
            uint256 startingBalance = makerToken.balanceOf(makerAddress);
            if (startingBalance >= amount) {
                balances[i] = TokenBalance({
                    owner: makerAddress,
                    balance: startingBalance.sub(amount)
                });
                return true;
            } else {
                balances[i] = TokenBalance({
                    owner: makerAddress,
                    balance: startingBalance
                });
                return false;
            }
        }
    }

    /**
     * If the contract has paid a nonzero protocol fee, this function takes the sender's WETH if
     * they are untrusted, and validates the gas price otherwise
     */
    function validateProtocolFee(
        uint256 protocolFeePaid
    )
        private
    {
        if (protocolFeePaid != 0) {
            if (TRUSTED_MSG_SENDER[msg.sender]) {
                // Prevents a single exchange from using too much of the contract's WETH balance
                require(
                    tx.gasprice <= MAX_GAS_PRICE,
                    "ZeroExV3MultiOrderExchangeWrapper#validateProtocolFee: Maximum gas price exceeded"
                );
            } else {
                // If the sender is untrusted, use their own WETH
                WETH_TOKEN.transferFrom(
                    msg.sender,
                    address(this),
                    protocolFeePaid
                );
            }
        }
    }

    /**
     * Validates that a certain takerAmount and makerAmount are within the maxPrice bounds
     */
    function validateTradePrice(
        TokenAmounts memory priceRatio,
        uint256 takerAmount,
        uint256 makerAmount
    )
        private
        pure
    {
        require(
            priceRatio.makerAmount == 0 ||
            takerAmount.mul(priceRatio.makerAmount) <= makerAmount.mul(priceRatio.takerAmount),
            "ZeroExV3MultiOrderExchangeWrapper#validateTradePrice: Price greater than maxPrice"
        );
    }

    /**
     * Validates that there is at least one order in orderData and that the length is correct
     */
    function validateOrderData(
        bytes memory orderData
    )
        private
        pure
    {
        require(
            orderData.length >= PRICE_DATA_LENGTH + ORDER_DATA_LENGTH
            && orderData.length.sub(PRICE_DATA_LENGTH) % ORDER_DATA_LENGTH == 0,
            "ZeroExV3MultiOrderExchangeWrapper#validateOrderData: Invalid orderData length"
        );
    }

    /**
     * Returns the number of orders given in the orderData
     */
    function parseNumOrders(
        bytes memory orderData
    )
        private
        pure
        returns (uint256)
    {
        return orderData.length.sub(PRICE_DATA_LENGTH).div(ORDER_DATA_LENGTH);
    }

    /**
     * Gets the bit-offset of the index'th order in orderData
     */
    function getOrderDataOffset(
        uint256 index
    )
        private
        pure
        returns (uint256)
    {
        return PRICE_DATA_LENGTH.add(index.mul(ORDER_DATA_LENGTH));
    }

    /**
     * Parses the maximum price from orderData
     */
    function parseMaxPriceRatio(
        bytes memory orderData
    )
        private
        pure
        returns (TokenAmounts memory)
    {
        uint256 takerAmountRatio = 0;
        uint256 makerAmountRatio = 0;

        /* solium-disable-next-line security/no-inline-assembly */
        assembly {
            takerAmountRatio := mload(add(orderData, 32))
            makerAmountRatio := mload(add(orderData, 64))
        }

        // require numbers to fit within 128 bits to prevent overflow when checking bounds
        require(
            uint128(takerAmountRatio) == takerAmountRatio,
            "ZeroExV3MultiOrderExchangeWrapper#parseMaxPriceRatio: takerAmountRatio > 128 bits"
        );
        require(
            uint128(makerAmountRatio) == makerAmountRatio,
            "ZeroExV3MultiOrderExchangeWrapper#parseMaxPriceRatio: makerAmountRatio > 128 bits"
        );

        return TokenAmounts({
            takerAmount: takerAmountRatio,
            makerAmount: makerAmountRatio
        });
    }

    /**
     * Parses all signatures from orderData
     */
    function parseSignatures(
        bytes memory orderData
    )
        private
        pure
        returns (bytes[] memory)
    {
        uint256 numOrders = parseNumOrders(orderData);
        bytes[] memory signatures = new bytes[](numOrders);

        for (uint256 i = 0; i < numOrders; i++) {
            // allocate new memory and cache pointer to it
            signatures[i] = new bytes(66);
            bytes memory signature = signatures[i];

            uint256 dataOffset = getOrderDataOffset(i);

            /* solium-disable-next-line security/no-inline-assembly */
            assembly {
                mstore(add(signature, 32), mload(add(add(orderData, 288), dataOffset))) // first 32 bytes of sig
                mstore(add(signature, 64), mload(add(add(orderData, 320), dataOffset))) // next 32 bytes of sig
                mstore(add(signature, 66), mload(add(add(orderData, 322), dataOffset))) // last 2 bytes of sig
            }
        }

        return signatures;
    }

    /**
     * Parses all orders from orderData
     */
    function parseOrders(
        bytes memory orderData,
        address makerToken,
        address takerToken
    )
        private
        pure
        returns (LibOrder.Order[] memory)
    {
        uint256 numOrders = parseNumOrders(orderData);
        LibOrder.Order[] memory orders = new LibOrder.Order[](numOrders);

        bytes memory makerAssetData = tokenAddressToAssetData(makerToken);
        bytes memory takerAssetData = tokenAddressToAssetData(takerToken);

        for (uint256 i = 0; i < numOrders; i++) {
            // store pointer to order memory
            LibOrder.Order memory order = orders[i];

            order.makerFee = 0;
            order.takerFee = 0;
            order.makerAssetData = makerAssetData;
            order.takerAssetData = takerAssetData;

            uint256 dataOffset = getOrderDataOffset(i);

            /* solium-disable-next-line security/no-inline-assembly */
            assembly {
                mstore(order,           mload(add(add(orderData, 32), dataOffset)))  // makerAddress
                mstore(add(order, 32),  mload(add(add(orderData, 64), dataOffset)))  // takerAddress
                mstore(add(order, 64),  mload(add(add(orderData, 96), dataOffset)))  // feeRecipientAddress
                mstore(add(order, 96),  mload(add(add(orderData, 128), dataOffset))) // senderAddress
                mstore(add(order, 128), mload(add(add(orderData, 160), dataOffset))) // makerAssetAmount
                mstore(add(order, 160), mload(add(add(orderData, 192), dataOffset))) // takerAssetAmount
                mstore(add(order, 256), mload(add(add(orderData, 224), dataOffset))) // expirationTimeSeconds
                mstore(add(order, 288), mload(add(add(orderData, 256), dataOffset))) // salt
            }
        }

        return orders;
    }

    /**
     * Converts a token address to 0x assetData
     */
    function tokenAddressToAssetData(
        address tokenAddress
    )
        private
        pure
        returns (bytes memory)
    {
        bytes memory result = new bytes(36);

        // padded version of bytes4(keccak256("ERC20Token(address)"));
        bytes32 selector = 0xf47261b000000000000000000000000000000000000000000000000000000000;

        /* solium-disable-next-line security/no-inline-assembly */
        assembly {
            // Store the selector and address in the asset data
            // The first 32 bytes of an array are the length (already set above)
            mstore(add(result, 32), selector)
            mstore(add(result, 36), tokenAddress)
        }

        return result;
    }
}
