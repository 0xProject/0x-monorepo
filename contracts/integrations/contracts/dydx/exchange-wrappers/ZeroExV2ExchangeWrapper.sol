/*

    Copyright 2018 dYdX Trading Inc.

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
import { ExchangeReader } from "./interfaces/ExchangeReader.sol";
import { ExchangeWrapper } from "./interfaces/ExchangeWrapper.sol";
import { MathHelpers } from "./libs/MathHelpers.sol";
import { TokenInteract } from "./libs/TokenInteract.sol";


/**
 * @title ZeroExV2ExchangeWrapper
 * @author dYdX
 *
 * dYdX ExchangeWrapper to interface with 0x Version 2
 */
contract ZeroExV2ExchangeWrapper is
    ExchangeWrapper,
    ExchangeReader
{
    using SafeMath for uint256;
    using TokenInteract for address;

    // ============ State Variables ============

    // msg.senders that will put the correct tradeOriginator in callerData when doing an exchange
    mapping (address => bool) public TRUSTED_MSG_SENDER;

    // address of the ZeroEx V2 Exchange
    address public ZERO_EX_EXCHANGE;

    // address of the ZeroEx V2 ERC20Proxy
    address public ZERO_EX_TOKEN_PROXY;

    // address of the ZRX token
    address public ZRX;

    // ============ Constructor ============

    constructor(
        address zeroExExchange,
        address zeroExProxy,
        address zrxToken,
        address[] memory trustedMsgSenders
    )
        public
    {
        ZERO_EX_EXCHANGE = zeroExExchange;
        ZERO_EX_TOKEN_PROXY = zeroExProxy;
        ZRX = zrxToken;

        for (uint256 i = 0; i < trustedMsgSenders.length; i++) {
            TRUSTED_MSG_SENDER[trustedMsgSenders[i]] = true;
        }

        // The ZRX token does not decrement allowance if set to MAX_UINT
        // therefore setting it once to the maximum amount is sufficient
        // NOTE: this is *not* standard behavior for an ERC20, so do not rely on it for other tokens
        ZRX.approve(ZERO_EX_TOKEN_PROXY, MathHelpers.maxUint256());
    }

    // ============ Public Functions ============

    function exchange(
        address tradeOriginator,
        address receiver,
        address makerToken,
        address takerToken,
        uint256 requestedFillAmount,
        bytes calldata orderData
    )
        external
        returns (uint256)
    {
        // prepare the exchange
        LibOrder.Order memory order = parseOrder(orderData, makerToken, takerToken);
        bytes memory signature = parseSignature(orderData);

        // transfer ZRX fee from trader if applicable
        transferTakerFee(
            order,
            tradeOriginator,
            requestedFillAmount
        );

        // make sure that the exchange can take the tokens from this contract
        ensureAllowance(
            takerToken,
            ZERO_EX_TOKEN_PROXY,
            requestedFillAmount
        );

        // do the exchange
        IExchange v2Exchange = IExchange(ZERO_EX_EXCHANGE);
        LibFillResults.FillResults memory fill = v2Exchange.fillOrKillOrder(order, requestedFillAmount, signature);

        // validate results
        assert(fill.takerAssetFilledAmount == requestedFillAmount);

        // set allowance
        ensureAllowance(makerToken, receiver, fill.makerAssetFilledAmount);

        return fill.makerAssetFilledAmount;
    }

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
        LibOrder.Order memory order = parseOrder(orderData, makerToken, takerToken);

        return MathHelpers.getPartialAmountRoundedUp(
            order.takerAssetAmount,
            order.makerAssetAmount,
            desiredMakerToken
        );
    }

    function getMaxMakerAmount(
        address makerToken,
        address takerToken,
        bytes calldata orderData
    )
        external
        view
        returns (uint256)
    {
        LibOrder.Order memory order = parseOrder(orderData, makerToken, takerToken);
        IExchange v2Exchange = IExchange(ZERO_EX_EXCHANGE);
        LibOrder.OrderInfo memory orderInfo = v2Exchange.getOrderInfo(order);

        if (orderInfo.orderStatus != uint8(LibOrder.OrderStatus.FILLABLE)) {
            return 0;
        }

        uint256 remainingTakerAssetAmount =
            order.takerAssetAmount.sub(orderInfo.orderTakerAssetFilledAmount);

        return MathHelpers.getPartialAmount(
            remainingTakerAssetAmount,
            order.takerAssetAmount,
            order.makerAssetAmount
        );
    }

    // ============ Private Functions ============

    function ensureAllowance(
        address token,
        address spender,
        uint256 requiredAmount
    )
        private
    {
        if (token.allowance(address(this), spender) >= requiredAmount) {
            return;
        }

        token.approve(
            spender,
            MathHelpers.maxUint256()
        );
    }

    function transferTakerFee(
        LibOrder.Order memory order,
        address tradeOriginator,
        uint256 requestedFillAmount
    )
        private
    {
        uint256 takerFee = MathHelpers.getPartialAmount(
            requestedFillAmount,
            order.takerAssetAmount,
            order.takerFee
        );

        if (takerFee == 0) {
            return;
        }

        require(
            TRUSTED_MSG_SENDER[msg.sender],
            "ZeroExV2ExchangeWrapper#transferTakerFee: Only trusted senders can dictate the fee payer"
        );

        ZRX.transferFrom(
            tradeOriginator,
            address(this),
            takerFee
        );
    }

    function parseSignature(
        bytes memory orderData
    )
        private
        pure
        returns (bytes memory)
    {
        bytes memory signature = new bytes(66);

        /* solium-disable-next-line security/no-inline-assembly */
        assembly {
            mstore(add(signature, 32), mload(add(orderData, 352)))  // first 32 bytes
            mstore(add(signature, 64), mload(add(orderData, 384)))  // next 32 bytes
            mstore(add(signature, 66), mload(add(orderData, 386)))  // last 2 bytes
        }

        return signature;
    }

    function parseOrder(
        bytes memory orderData,
        address makerToken,
        address takerToken
    )
        private
        pure
        returns (LibOrder.Order memory)
    {
        LibOrder.Order memory order;

        /* solium-disable-next-line security/no-inline-assembly */
        assembly {
            mstore(order,           mload(add(orderData, 32)))  // makerAddress
            mstore(add(order, 32),  mload(add(orderData, 64)))  // takerAddress
            mstore(add(order, 64),  mload(add(orderData, 96)))  // feeRecipientAddress
            mstore(add(order, 96),  mload(add(orderData, 128))) // senderAddress
            mstore(add(order, 128), mload(add(orderData, 160))) // makerAssetAmount
            mstore(add(order, 160), mload(add(orderData, 192))) // takerAssetAmount
            mstore(add(order, 192), mload(add(orderData, 224))) // makerFee
            mstore(add(order, 224), mload(add(orderData, 256))) // takerFee
            mstore(add(order, 256), mload(add(orderData, 288))) // expirationTimeSeconds
            mstore(add(order, 288), mload(add(orderData, 320))) // salt
        }

        order.makerAssetData = tokenAddressToAssetData(makerToken);
        order.takerAssetData = tokenAddressToAssetData(takerToken);

        return order;
    }

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
