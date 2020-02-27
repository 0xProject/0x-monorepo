pragma solidity ^0.5.9;
pragma experimental ABIEncoderV2;


contract DummyLiquidityProviderRegistry
{
    address private constant NULL_ADDRESS = address(0x0);

    constructor()
        public
    {}

    mapping (address => mapping (address => address)) internal _gAddressBook;

    /// @dev Sets address of pool for a market given market (xAsset, yAsset).
    /// @param takerToken First asset managed by pool.
    /// @param makerToken Second asset managed by pool.
    /// @param poolAddress Address of pool.
    function setLiquidityProviderForMarket(
        address takerToken,
        address makerToken,
        address poolAddress
    ) external
    {
        _gAddressBook[takerToken][makerToken] = poolAddress;
        _gAddressBook[makerToken][takerToken] = poolAddress;
    }

    /// @dev Returns the address of pool for a market given market (xAsset, yAsset), or reverts if pool does not exist.
    /// @param takerToken First asset managed by pool.
    /// @param makerToken Second asset managed by pool.
    /// @return Address of pool.
    function getLiquidityProviderForMarket(
        address takerToken,
        address makerToken
    )
        external
        view
        returns (address poolAddress)
    {
        poolAddress = _gAddressBook[takerToken][makerToken];
        require(
            poolAddress != NULL_ADDRESS,
            "PLPRegistry/MARKET_PAIR_NOT_SET"
        );
    }
}