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

import "../../protocol/Exchange/libs/LibOrder.sol";
import "../../protocol/Exchange/libs/LibFillResults.sol";
import "../interfaces/IForwarderCore.sol";


contract MForwarderCore is
    IForwarderCore
{

    /// @dev Market sells WETH for ERC20 tokens.
    /// @param orders An array of Order struct containing order specifications.
    /// @param signatures An array of Proof that order has been created by maker.
    /// @param feeOrders An array of Order struct containing order specifications for fees.
    /// @param feeSignatures An array of Proof that order has been created by maker for the fee orders.
    /// @param wethSellAmount The amount of WETH to sell.
    /// @return FillResults amounts filled and fees paid by maker and taker.
    function marketSellEthForERC20Internal(
        LibOrder.Order[] memory orders,
        bytes[] memory signatures,
        LibOrder.Order[] memory feeOrders,
        bytes[] memory feeSignatures,
        uint256 wethSellAmount
    )
        internal
        returns (LibFillResults.FillResults memory totalFillResults);

    /// @dev Market sells WETH for ZRX tokens.
    /// @param orders An array of Order struct containing order specifications.
    /// @param signatures An array of Proof that order has been created by maker.
    /// @param wethSellAmount The amount of WETH to sell.
    /// @return FillResults amounts filled and fees paid by maker and taker.
    function marketSellEthForZRXInternal(
        LibOrder.Order[] memory orders,
        bytes[] memory signatures,
        uint256 wethSellAmount
    )
        internal
        returns (LibFillResults.FillResults memory totalFillResults);

    /// @dev Buys an exact amount of an ERC20 token using WETH.
    /// @param orders Orders to fill. The maker asset is the ERC20 token to buy. The taker asset is WETH.
    /// @param signatures Proof that the orders were created by their respective makers.
    /// @param feeOrders to fill. The maker asset is ZRX and the taker asset is WETH.
    /// @param feeSignatures Proof that the feeOrders were created by their respective makers.
    /// @param makerTokenFillAmount Amount of the ERC20 token to buy.
    /// @return totalFillResults Aggregated fill results of buying the ERC20 and ZRX tokens.
    function marketBuyERC20TokensInternal(
        LibOrder.Order[] memory orders,
        bytes[] memory signatures,
        LibOrder.Order[] memory feeOrders,
        bytes[] memory feeSignatures,
        uint256 makerTokenFillAmount
    )
        internal
        returns (LibFillResults.FillResults memory totalFillResults);

    /// @dev Buys an all of the ERC721 tokens in the orders.
    /// @param orders Orders to fill. The maker asset is the ERC721 token to buy. The taker asset is WETH.
    /// @param signatures Proof that the orders were created by their respective makers.
    /// @param feeOrders to fill. The maker asset is ZRX and the taker asset is WETH.
    /// @param feeSignatures Proof that the feeOrders were created by their respective makers.
    /// @return totalFillResults Aggregated fill results of buying the ERC721 tokens and ZRX tokens.
    function batchBuyERC721TokensInternal(
        LibOrder.Order[] memory orders,
        bytes[] memory signatures,
        LibOrder.Order[] memory feeOrders,
        bytes[] memory feeSignatures
    )
        internal
        returns (LibFillResults.FillResults memory totalFillResults);
}
