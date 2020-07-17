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

import "@0x/contracts-erc20/contracts/src/LibERC20Token.sol";
import "@0x/contracts-erc20/contracts/src/interfaces/IERC20Token.sol";
import "@0x/contracts-exchange/contracts/src/interfaces/IExchange.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibMath.sol";
import "@0x/contracts-utils/contracts/src/Refundable.sol";
import "@0x/contracts-utils/contracts/src/LibBytes.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibFillResults.sol";
import "../src/bridges/RitualBridge.sol";


contract TestExchange is
    Refundable
{
    using LibBytes for bytes;

    event MarketSellCalled(
        uint256 takerAssetFillAmount,
        uint256 msgValue
    );

    function marketSellOrdersNoThrow(
        LibOrder.Order[] memory orders,
        uint256 takerAssetFillAmount,
        bytes[] memory signatures
    )
        public
        payable
        disableRefundUntilEnd
        returns (LibFillResults.FillResults memory fillResults)
    {
        emit MarketSellCalled(
            takerAssetFillAmount,
            msg.value
        );

        address makerToken = orders[0].makerAssetData.readAddress(16);
        address takerToken = orders[0].takerAssetData.readAddress(16);

        IERC20Token(takerToken).transferFrom(
            msg.sender,
            orders[0].makerAddress,
            takerAssetFillAmount
        );

        uint256 makerAssetAmount = LibMath.safeGetPartialAmountFloor(
            orders[0].makerAssetAmount,
            orders[0].takerAssetAmount,
            takerAssetFillAmount
        );
        IERC20Token(makerToken).transferFrom(
            orders[0].makerAddress,
            msg.sender,
            makerAssetAmount
        );
    }

    function getAssetProxy(bytes4 assetProxyId)
        public
        view
        returns (address)
    {
        return address(this);
    }
}

contract TestRitualBridge is
    RitualBridge
{
    event MarketSellCalled(
        uint256 takerAssetFillAmount,
        uint256 msgValue
    );

    address internal _weth;

    constructor(address weth)
        public
        RitualBridge(address(new TestExchange()))
    {
        _weth = weth;
    }

    function getExchangeAddress()
        external
        view
        returns (address)
    {
        return address(EXCHANGE);
    }

    function _getWethAddress()
        internal
        view
        returns (address)
    {
        return _weth;
    }
}
