/*

  Copyright 2019 ZeroEx Intl.

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
import "@0x/contracts-erc20/contracts/src/LibERC20Token.sol";
import "@0x/contracts-erc20/contracts/src/interfaces/IEtherToken.sol";
import "@0x/contracts-exchange/contracts/src/interfaces/IExchange.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibFillResults.sol";
import "@0x/contracts-utils/contracts/src/DeploymentConstants.sol";
import "@0x/contracts-utils/contracts/src/LibSafeMath.sol";


/// @dev A forwarder contract for filling 0x asset-swapper aggregated orders.
///      The forwarder is necessary to purchase taker assets and set up
///      approvals in one transaction. Only call the functions on this contract
///      in an `eth_call` context or you will lose money!
contract TestMainnetAggregatorFills is
    DeploymentConstants
{
    using LibSafeMath for uint256;

    address constant internal EXCHANGE_ADDRESS = 0x61935CbDd02287B511119DDb11Aeb42F1593b7Ef;
    bytes4 constant internal ERC20_PROXY_ID = 0xf47261b0; // bytes4(keccak256("ERC20Token(address)"));

    struct SimulatedMarketFillResults {
        uint256 makerAssetBalanceBefore;
        uint256 takerAssetBalanceBefore;
        uint256 makerAssetBalanceAfter;
        uint256 takerAssetBalanceAfter;
        LibFillResults.FillResults fillResults;
    }

    // solhint-disable-next-line no-empty-blocks
    function() external payable {}

    /// @dev Buy taker assets with ETH from `takerOrders` and then perform a
    ///      market buy on `makerOrders`.
    function marketBuy(
        address makerTokenAddress,
        address takerTokenAddress,
        LibOrder.Order[] memory makerOrders,
        LibOrder.Order[] memory takerOrders,
        bytes[] memory makerOrderSignatures,
        bytes[] memory takerOrderSignatures,
        uint256 makerAssetBuyAmount
    )
        public
        payable
        returns (SimulatedMarketFillResults memory results)
    {
        _prepareFunds(takerTokenAddress, makerOrders, takerOrders, takerOrderSignatures);
        results.makerAssetBalanceBefore = IERC20Token(makerTokenAddress).balanceOf(address(this));
        results.takerAssetBalanceBefore = IERC20Token(takerTokenAddress).balanceOf(address(this));
        results.fillResults = IExchange(EXCHANGE_ADDRESS)
            .marketBuyOrdersNoThrow
            .value(address(this).balance)(
                makerOrders,
                makerAssetBuyAmount,
                makerOrderSignatures
            );
        results.makerAssetBalanceAfter = IERC20Token(makerTokenAddress).balanceOf(address(this));
        results.takerAssetBalanceAfter = IERC20Token(takerTokenAddress).balanceOf(address(this));
    }

    /// @dev Buy taker assets with ETH from `takerOrders` and then perform a
    ///      market sell on `makerOrders`.
    function marketSell(
        address makerTokenAddress,
        address takerTokenAddress,
        LibOrder.Order[] memory makerOrders,
        LibOrder.Order[] memory takerOrders,
        bytes[] memory makerOrderSignatures,
        bytes[] memory takerOrderSignatures,
        uint256 takerAssetSellAmount
    )
        public
        payable
        returns (SimulatedMarketFillResults memory results)
    {
        _prepareFunds(takerTokenAddress, makerOrders, takerOrders, takerOrderSignatures);
        results.makerAssetBalanceBefore = IERC20Token(makerTokenAddress).balanceOf(address(this));
        results.takerAssetBalanceBefore = IERC20Token(takerTokenAddress).balanceOf(address(this));
        results.fillResults = IExchange(EXCHANGE_ADDRESS)
            .marketSellOrdersNoThrow
            .value(address(this).balance)(
                makerOrders,
                takerAssetSellAmount,
                makerOrderSignatures
            );
        results.makerAssetBalanceAfter = IERC20Token(makerTokenAddress).balanceOf(address(this));
        results.takerAssetBalanceAfter = IERC20Token(takerTokenAddress).balanceOf(address(this));
    }

    /// @dev Like `marketSell`, but calls `fillOrder()` individually to detect
    ///      errors.
    function fillOrders(
        address makerTokenAddress,
        address takerTokenAddress,
        LibOrder.Order[] memory makerOrders,
        LibOrder.Order[] memory takerOrders,
        bytes[] memory makerOrderSignatures,
        bytes[] memory takerOrderSignatures,
        uint256 takerAssetSellAmount
    )
        public
        payable
        returns (SimulatedMarketFillResults memory results)
    {
        _prepareFunds(takerTokenAddress, makerOrders, takerOrders, takerOrderSignatures);
        results.makerAssetBalanceBefore = IERC20Token(makerTokenAddress).balanceOf(address(this));
        results.takerAssetBalanceBefore = IERC20Token(takerTokenAddress).balanceOf(address(this));
        for (uint256 i = 0; i < makerOrders.length; i++) {
            if (takerAssetSellAmount == 0) {
                break;
            }
            LibFillResults.FillResults memory fillResults = IExchange(EXCHANGE_ADDRESS)
                .fillOrder
                .value(address(this).balance)(
                    makerOrders[i],
                    takerAssetSellAmount,
                    makerOrderSignatures[i]
                );
            results.fillResults = LibFillResults.addFillResults(results.fillResults, fillResults);
            takerAssetSellAmount = takerAssetSellAmount.safeSub(fillResults.takerAssetFilledAmount);
        }
        results.makerAssetBalanceAfter = IERC20Token(makerTokenAddress).balanceOf(address(this));
        results.takerAssetBalanceAfter = IERC20Token(takerTokenAddress).balanceOf(address(this));
    }

    function _approveAssetProxy(address tokenAddress) private {
        address assetProxyAddress = IExchange(EXCHANGE_ADDRESS).getAssetProxy(ERC20_PROXY_ID);
        LibERC20Token.approve(tokenAddress, assetProxyAddress, uint256(-1));
    }

    /// @dev Buys as much of `takerOrders` as possible with the ETH transferred
    ///      to this contract, leaving enough ETH behind for protocol fees.
    function _prepareFunds(
        address takerTokenAddress,
        LibOrder.Order[] memory makerOrders,
        LibOrder.Order[] memory takerOrders,
        bytes[] memory takerOrderSignatures
    )
        private
    {
        _approveAssetProxy(_getWethAddress());
        uint256 protocolFee = IExchange(EXCHANGE_ADDRESS).protocolFeeMultiplier() * tx.gasprice;
        uint256 maxProtocolFees = protocolFee * (takerOrders.length + makerOrders.length);
        uint256 ethSellAmount = msg.value.safeSub(maxProtocolFees);
        IEtherToken(_getWethAddress()).deposit.value(ethSellAmount)();
        if (takerTokenAddress != _getWethAddress()) {
            IExchange(EXCHANGE_ADDRESS)
                .marketSellOrdersNoThrow
                .value(maxProtocolFees)(
                    takerOrders,
                    ethSellAmount,
                    takerOrderSignatures
                );
            _approveAssetProxy(takerTokenAddress);
        }
    }
}
