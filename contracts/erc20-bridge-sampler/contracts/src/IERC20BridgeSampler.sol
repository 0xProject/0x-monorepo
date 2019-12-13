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

import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";


interface IERC20BridgeSampler {

    /// @dev Query native orders and sample sell quotes on multiple DEXes at once.
    /// @param orders Native orders to query.
    /// @param orderSignatures Signatures for each respective order in `orders`.
    /// @param sources Address of each DEX. Passing in an unsupported DEX will throw.
    /// @param takerTokenAmounts Taker token sell amount for each sample.
    /// @return orderFillableTakerAssetAmounts How much taker asset can be filled
    ///         by each order in `orders`.
    /// @return makerTokenAmountsBySource Maker amounts bought for each source at
    ///         each taker token amount. First indexed by source index, then sample
    ///         index.
    function queryOrdersAndSampleSells(
        LibOrder.Order[] calldata orders,
        bytes[] calldata orderSignatures,
        address[] calldata sources,
        uint256[] calldata takerTokenAmounts
    )
        external
        view
        returns (
            uint256[] memory orderFillableTakerAssetAmounts,
            uint256[][] memory makerTokenAmountsBySource
        );

    /// @dev Query native orders and sample buy quotes on multiple DEXes at once.
    /// @param orders Native orders to query.
    /// @param orderSignatures Signatures for each respective order in `orders`.
    /// @param sources Address of each DEX. Passing in an unsupported DEX will throw.
    /// @param makerTokenAmounts Maker token buy amount for each sample.
    /// @return orderFillableMakerAssetAmounts How much maker asset can be filled
    ///         by each order in `orders`.
    /// @return takerTokenAmountsBySource Taker amounts sold for each source at
    ///         each maker token amount. First indexed by source index, then sample
    ///         index.
    function queryOrdersAndSampleBuys(
        LibOrder.Order[] calldata orders,
        bytes[] calldata orderSignatures,
        address[] calldata sources,
        uint256[] calldata makerTokenAmounts
    )
        external
        view
        returns (
            uint256[] memory orderFillableMakerAssetAmounts,
            uint256[][] memory makerTokenAmountsBySource
        );

    /// @dev Queries the fillable taker asset amounts of native orders.
    /// @param orders Native orders to query.
    /// @param orderSignatures Signatures for each respective order in `orders`.
    /// @return orderFillableTakerAssetAmounts How much taker asset can be filled
    ///         by each order in `orders`.
    function getOrderFillableTakerAssetAmounts(
        LibOrder.Order[] calldata orders,
        bytes[] calldata orderSignatures
    )
        external
        view
        returns (uint256[] memory orderFillableTakerAssetAmounts);

    /// @dev Queries the fillable maker asset amounts of native orders.
    /// @param orders Native orders to query.
    /// @param orderSignatures Signatures for each respective order in `orders`.
    /// @return orderFillableMakerAssetAmounts How much maker asset can be filled
    ///         by each order in `orders`.
    function getOrderFillableMakerAssetAmounts(
        LibOrder.Order[] calldata orders,
        bytes[] calldata orderSignatures
    )
        external
        view
        returns (uint256[] memory orderFillableMakerAssetAmounts);

    /// @dev Sample sell quotes on multiple DEXes at once.
    /// @param sources Address of each DEX. Passing in an unsupported DEX will throw.
    /// @param takerToken Address of the taker token (what to sell).
    /// @param makerToken Address of the maker token (what to buy).
    /// @param takerTokenAmounts Taker token sell amount for each sample.
    /// @return makerTokenAmountsBySource Maker amounts bought for each source at
    ///         each taker token amount. First indexed by source index, then sample
    ///         index.
    function sampleSells(
        address[] calldata sources,
        address takerToken,
        address makerToken,
        uint256[] calldata takerTokenAmounts
    )
        external
        view
        returns (uint256[][] memory makerTokenAmountsBySource);

    /// @dev Query native orders and sample buy quotes on multiple DEXes at once.
    /// @param sources Address of each DEX. Passing in an unsupported DEX will throw.
    /// @param takerToken Address of the taker token (what to sell).
    /// @param makerToken Address of the maker token (what to buy).
    /// @param makerTokenAmounts Maker token buy amount for each sample.
    /// @return takerTokenAmountsBySource Taker amounts sold for each source at
    ///         each maker token amount. First indexed by source index, then sample
    ///         index.
    function sampleBuys(
        address[] calldata sources,
        address takerToken,
        address makerToken,
        uint256[] calldata makerTokenAmounts
    )
        external
        view
        returns (uint256[][] memory takerTokenAmountsBySource);
}
