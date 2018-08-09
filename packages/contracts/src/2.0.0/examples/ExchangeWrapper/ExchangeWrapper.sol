/*

  Copyright 2018 ZeroEx Intl.

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

pragma solidity 0.4.24;
pragma experimental ABIEncoderV2;

import "../../protocol/Exchange/interfaces/IExchange.sol";
import "../../protocol/Exchange/libs/LibOrder.sol";


contract ExchangeWrapper {

    // Exchange contract.
    // solhint-disable-next-line var-name-mixedcase
    IExchange internal EXCHANGE;

    constructor (address _exchange)
        public
    {
        EXCHANGE = IExchange(_exchange);
    }

    /// @dev Cancels all orders created by sender with a salt less than or equal to the targetOrderEpoch
    ///      and senderAddress equal to this contract.
    /// @param targetOrderEpoch Orders created with a salt less or equal to this value will be cancelled.
    /// @param salt Arbitrary value to gaurantee uniqueness of 0x transaction hash.
    /// @param makerSignature Proof that maker wishes to call this function with given params.
    function cancelOrdersUpTo(
        uint256 targetOrderEpoch,
        uint256 salt,
        bytes makerSignature
    )
        external
    {
        address makerAddress = msg.sender;

        // Encode arguments into byte array.
        bytes memory data = abi.encodeWithSelector(
            EXCHANGE.cancelOrdersUpTo.selector,
            targetOrderEpoch
        );

        // Call `cancelOrdersUpTo` via `executeTransaction`.
        EXCHANGE.executeTransaction(
            salt,
            makerAddress,
            data,
            makerSignature
        );
    }

    /// @dev Fills an order using `msg.sender` as the taker.
    /// @param order Order struct containing order specifications.
    /// @param takerAssetFillAmount Desired amount of takerAsset to sell.
    /// @param salt Arbitrary value to gaurantee uniqueness of 0x transaction hash.
    /// @param orderSignature Proof that order has been created by maker.
    /// @param takerSignature Proof that taker wishes to call this function with given params.
    function fillOrder(
        LibOrder.Order memory order,
        uint256 takerAssetFillAmount,
        uint256 salt,
        bytes memory orderSignature,
        bytes memory takerSignature
    )
        public
    {
        address takerAddress = msg.sender;

        // Encode arguments into byte array.
        bytes memory data = abi.encodeWithSelector(
            EXCHANGE.fillOrder.selector,
            order,
            takerAssetFillAmount,
            orderSignature
        );

        // Call `fillOrder` via `executeTransaction`.
        EXCHANGE.executeTransaction(
            salt,
            takerAddress,
            data,
            takerSignature
        );
    }
}
