pragma solidity ^0.5.9;
pragma experimental ABIEncoderV2;


contract DummyPLPRegistry
{
    address private constant NULL_ADDRESS = address(0x0);

    constructor()
        public
    {}

    event PoolForMarketUpdated(
        address indexed xAsset,
        address indexed yAsset,
        address poolAddress
    );

    mapping (address => mapping (address => address)) internal _gAddressBook;

    /// @dev Sets address of pool for a market given market (xAsset, yAsset).
    /// @param xAsset First asset managed by pool.
    /// @param yAsset Second asset managed by pool.
    /// @param poolAddress Address of pool.
    function setPoolForMarket(
        address xAsset,
        address yAsset,
        address poolAddress
    ) external
    {
        _gAddressBook[xAsset][yAsset] = poolAddress;
        _gAddressBook[yAsset][xAsset] = poolAddress;
        emit PoolForMarketUpdated(xAsset, yAsset, poolAddress);
    }

    /// @dev Returns the address of pool for a market given market (xAsset, yAsset), or reverts if pool does not exist.
    /// @param xAsset First asset managed by pool.
    /// @param yAsset Second asset managed by pool.
    /// @return Address of pool.
    function getPoolForMarket(
        address xAsset,
        address yAsset
    )
        external
        view
        returns (address poolAddress)
    {
        poolAddress = _gAddressBook[xAsset][yAsset];
        require(
            poolAddress != NULL_ADDRESS,
            "PLPRegistry/MARKET_PAIR_NOT_SET"
        );
    }
}