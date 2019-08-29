/* Retrieved from https://raw.githubusercontent.com/0xProject/exchange-wrappers/feat/0x-coordinator-wrapper/contracts/exchange-wrappers/ZeroExV2CoordinatorMultiOrderExchangeWrapper.sol
on August 29, 2019. */

pragma solidity 0.5.9;
pragma experimental ABIEncoderV2;

import { SafeMath } from "openzeppelin-solidity/contracts/math/SafeMath.sol";
import { IExchange } from "../external/0x/v2/interfaces/IExchange.sol";
import { ICoordinatorCore } from "../external/0x/v2/interfaces/ICoordinatorCore.sol";
import { LibOrder } from "../external/0x/v2/libs/LibOrder.sol";
import { LibZeroExTransaction } from "../external/0x/v2/libs/LibZeroExTransaction.sol";
import { ExchangeWrapper } from "../interfaces/ExchangeWrapper.sol";
import { MathHelpers } from "../lib/MathHelpers.sol";
import { TokenInteract } from "../lib/TokenInteract.sol";
import { AdvancedTokenInteract } from "../lib/AdvancedTokenInteract.sol";

/**
 * @title ZeroExV2MultiOrderExchangeWrapper
 * @author 0x
 *
 * dYdX ExchangeWrapper to interface with 0x Version 2.1 Coordinator contract. Sends multiple orders at once. Assumes no
 * ZRX fees.
 */
contract ZeroExV2CoordinatorMultiOrderExchangeWrapper is
    LibOrder,
    LibZeroExTransaction,
    ExchangeWrapper
{
    using SafeMath for uint256;
    using TokenInteract for address;
    using AdvancedTokenInteract for address;

    // ============ Constants ============

    // bytes4(keccak256("isValidWalletSignature(bytes32,address,bytes)"))
    // The 0x Exchange v2.1 contract requires that this value is returned for a successful `Wallet` signature validation
    bytes4 constant IS_VALID_WALLET_SIGNATURE_MAGIC_VALUE = 0xb0671381;

    // Byte that represents the 0x Exchange v2.1 `Wallet` signature type
    bytes constant WALLET_SIGNATURE_TYPE = hex"04";

    // ============ Structs ============

    struct TokenAmounts {
        uint256 takerAmount;
        uint256 makerAmount;
    }

    struct CoordinatorArgs {
        Order[] orders;                           // orders for `marketSellOrdersNoThrow`
        bytes[] orderSignatures;                  // maker signatures for each order
        uint256 transactionSalt;                  // salt to facilitate randomness in ZeroExTransaction hash
        uint256[] approvalExpirationTimeSeconds;  // timestamps at which Coordinator approvals expire
        bytes[] approvalSignatures;               // signatures of Coordinators that approved the transaction
    }

    struct TokenBalance {
        address owner;
        uint256 balance;
    }

    // ============ State Variables ============

    // address of the ZeroEx V2.1 Exchange
    address public ZERO_EX_EXCHANGE;

    // address of the ZeroEx V2.1 Coordinator
    address public ZERO_EX_COORDINATOR;

    // address of the ZeroEx V2 ERC20Proxy
    address public ZERO_EX_TOKEN_PROXY;

    // ============ Constructor ============
    constructor(
        address zeroExExchange,
        address zeroExCoordinator,
        address zeroExProxy
    )
        public
    {
        ZERO_EX_EXCHANGE = zeroExExchange;
        ZERO_EX_COORDINATOR = zeroExCoordinator;
        ZERO_EX_TOKEN_PROXY = zeroExProxy;
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
        // Ensure that the ERC20Proxy can take the takerTokens from this contract
        takerToken.ensureAllowance(ZERO_EX_TOKEN_PROXY, requestedFillAmount);

        // Decode `orderData`
        (TokenAmounts memory priceRatio, CoordinatorArgs memory args) = abi.decode(
            orderData,
            (TokenAmounts, CoordinatorArgs)
        );

        // Query initial balances of makerToken and takerToken
        // These should be 0 unless tokens were erroneously sent to this contract
        TokenAmounts memory initialBalances = getTakerMakerTokenBalances(takerToken, makerToken);

        // Encode data for `marketSellOrdersNoThrow`
        bytes memory marketSellOrdersNoThrowData = abi.encodeWithSelector(
            IExchange(address(0)).marketSellOrdersNoThrow.selector,
            args.orders,
            requestedFillAmount,
            args.orderSignatures
        );

        // Construct ZeroExTransaction on behalf of this contract
        ZeroExTransaction memory transaction = ZeroExTransaction({
            salt: args.transactionSalt,
            data: marketSellOrdersNoThrowData,
            signerAddress: address(this)
        });

        // Call `marketSellOrdersNoThrow` through the Coordinator contract
        // Either succeeds or throws
        ICoordinatorCore(ZERO_EX_COORDINATOR).executeTransaction(
            transaction,
            tx.origin,
            WALLET_SIGNATURE_TYPE,
            args.approvalExpirationTimeSeconds,
            args.approvalSignatures
        );

        // Query balances after fill and calculate amounts filled
        TokenAmounts memory fillResults = calculateFillResults(takerToken, makerToken, initialBalances);

        // Validate that all taker tokens were sold
        require(
            fillResults.takerAmount == requestedFillAmount,
            "ZeroExV2CoordinatorMultiOrderExchangeWrapper#exchange: Cannot sell enough taker token"
        );

        // Validate that max price is not violated
        validateTradePrice(
            priceRatio,
            fillResults.takerAmount,
            fillResults.makerAmount
        );

        // Ensure that the caller can take the makerTokens from this contract
        makerToken.ensureAllowance(receiver, fillResults.makerAmount);

        return fillResults.makerAmount;
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
     * @return                    Amount of takerToken the needed to complete the exchange
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
        // Decode `orderData`
        (TokenAmounts memory priceRatio, CoordinatorArgs memory args) = abi.decode(
            orderData,
            (TokenAmounts, CoordinatorArgs)
        );

        // Validate that none of the coordinator approvals have expired
        validateApprovalExpirationTimes(args.approvalExpirationTimeSeconds);

        // Keep running count of how much takerToken is needed until desiredMakerToken is acquired
        TokenAmounts memory total;
        total.takerAmount = 0;
        total.makerAmount = desiredMakerToken;

        // gets the exchange cost. modifies total
        uint256 takerCost = getExchangeCostInternal(
            makerToken,
            args.orders,
            total
        );

        // validate that max price will not be violated
        validateTradePrice(priceRatio, takerCost, desiredMakerToken);

        // return the amount of taker token needed
        return takerCost;
    }

    /**
     * Used to validate `Wallet` signatures for this contract within the 0x Exchange contract.
     * This function will consider all hash and signature combinations as valid.
     * @return Magic value required for a successful `Wallet` signature validation in the 0x Exchange v2.1 contract.
     */
    function isValidSignature(
        bytes32 /* hash */,
        bytes calldata /* signature */
    )
        external
        pure
        returns (bytes4)
    {
        // All signatures are always considered valid
        // This contract should never hold a balance, but value can be passed through
        return IS_VALID_WALLET_SIGNATURE_MAGIC_VALUE;
    }

    // ============ Private Functions ============

    /**
     * Gets the amount of takerToken required to fill the amount of total.makerToken.
     * Does not return a value, only modifies the values inside total.
     */
    function getExchangeCostInternal(
        address makerToken,
        Order[] memory orders,
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
            Order memory order = orders[i];

            // get order info
            OrderInfo memory info = zeroExExchange.getOrderInfo(order);

            // ignore unfillable orders
            if (info.orderStatus != uint8(OrderStatus.FILLABLE)) {
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
            "ZeroExV2CoordinatorMultiOrderExchangeWrapper#getExchangeCostInternal: Cannot buy enough maker token"
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
     * Gets maker and taker token balances of this contract.
     */
    function getTakerMakerTokenBalances(
        address takerToken,
        address makerToken
    )
        private
        view
        returns (TokenAmounts memory balances)
    {
        address exchangeWrapper = address(this);
        balances.makerAmount = makerToken.balanceOf(exchangeWrapper);
        balances.takerAmount = takerToken.balanceOf(exchangeWrapper);
        return balances;
    }

    /**
     * Calculates the fill results based off of the delta in current balances and initial balances
     * of the maker and taker tokens.
     */
    function calculateFillResults(
        address takerToken,
        address makerToken,
        TokenAmounts memory initialBalances
    )
        private
        view
        returns (TokenAmounts memory fillResults)
    {
        TokenAmounts memory currentBalances = getTakerMakerTokenBalances(takerToken, makerToken);
        fillResults.makerAmount = currentBalances.makerAmount.sub(initialBalances.makerAmount);
        fillResults.takerAmount = currentBalances.takerAmount.sub(initialBalances.takerAmount);
        return fillResults;
    }

    /**
     * Validates that none of the coordinator approvals have expired
     */
    function validateApprovalExpirationTimes(uint256[] memory approvalExpirationTimeSeconds)
        private
        view
    {
        uint256 length = approvalExpirationTimeSeconds.length;
        for (uint i = 0; i != length; i++) {
            require(
                approvalExpirationTimeSeconds[i] > block.timestamp,
                "ZeroExV2CoordinatorMultiOrderExchangeWrapper#validateApprovalExpirationTimes: Expired approval"
            );
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
            "ZeroExV2CoordinatorMultiOrderExchangeWrapper#validateTradePrice: Price greater than maxPrice"
        );
    }
}
