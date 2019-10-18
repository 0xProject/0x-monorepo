pragma solidity ^0.5;
pragma experimental ABIEncoderV2;

import "./IExchange.sol";


interface IERC20BridgeSampler {

    /// @dev Query native orders and sample sell orders on multiple DEXes at once.
    /// @param orders Native orders to query.
    /// @param sources Address of each DEX. Passing in an unknown DEX will throw.
    /// @param takerTokenAmounts Taker sell amount for each sample.
    /// @return orderInfos `OrderInfo`s for each order in `orders`.
    /// @return makerTokenAmountsBySource Maker amounts bought for each source at
    ///         each taker token amount. First indexed by source index, then sample
    ///         index.
    function queryOrdersAndSampleSells(
        IExchange.Order[] calldata orders,
        address[] calldata sources,
        uint256[] calldata takerTokenAmounts
    )
        external
        view
        returns (
            IExchange.OrderInfo[] memory orderInfos,
            uint256[][] memory makerTokenAmountsBySource
        );

    /// @dev Query native orders and sample buy orders on multiple DEXes at once.
    /// @param orders Native orders to query.
    /// @param sources Address of each DEX. Passing in an unknown DEX will throw.
    /// @param makerTokenAmounts Maker sell amount for each sample.
    /// @return orderInfos `OrderInfo`s for each order in `orders`.
    /// @return takerTokenAmountsBySource Taker amounts sold for each source at
    ///         each maker token amount. First indexed by source index, then sample
    ///         index.
    function queryOrdersAndSampleBuys(
        IExchange.Order[] calldata orders,
        address[] calldata sources,
        uint256[] calldata makerTokenAmounts
    )
        external
        view
        returns (
            IExchange.OrderInfo[] memory orderInfos,
            uint256[][] memory makerTokenAmountsBySource
        );
}
