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

import "@0x/contracts-exchange/contracts/src/interfaces/IExchange.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";
import "@0x/contracts-utils/contracts/src/Refundable.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibFillResults.sol";
import "../src/bridges/RitualBridge.sol";
import "../src/TestOracle.sol";


contract TestExchange is
    Refundable
{
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
        RitualBridge(address(0), address(0))
    {
        _weth = weth;
        EXCHANGE = IExchange(address(new TestExchange()));
        ORACLE = IChainlinkOracle(address(new TestOracle()));
    }

    function getOracleAddress()
        external
        view
        returns (address)
    {
        return address(ORACLE);
    }

    function _getWethAddress()
        internal
        view
        returns (address)
    {
        return _weth;
    }

}
