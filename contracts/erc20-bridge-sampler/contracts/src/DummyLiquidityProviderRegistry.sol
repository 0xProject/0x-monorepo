pragma solidity ^0.5.9;
pragma experimental ABIEncoderV2;


contract DummyLiquidityProviderRegistry
{
    address private constant NULL_ADDRESS = address(0x0);

    mapping (address => mapping (address => address)) internal _gAddressBook;

    /// @dev Sets address of pool for a market given market (xAsset, yAsset).
    /// @param xToken First asset managed by pool.
    /// @param yToken Second asset managed by pool.
    /// @param poolAddress Address of pool.
    function setLiquidityProviderForMarket(
        address xToken,
        address yToken,
        address poolAddress
    )
        external
    {
        _gAddressBook[xToken][yToken] = poolAddress;
        _gAddressBook[yToken][xToken] = poolAddress;
    }

    /// @dev Returns the address of pool for a market given market (xAsset, yAsset), or reverts if pool does not exist.
    /// @param xToken First asset managed by pool.
    /// @param yToken Second asset managed by pool.
    /// @return Address of pool.
    function getLiquidityProviderForMarket(
        address xToken,
        address yToken
    )
        external
        view
        returns (address poolAddress)
    {
        poolAddress = _gAddressBook[xToken][yToken];
        require(
            poolAddress != NULL_ADDRESS,
            "Registry/MARKET_PAIR_NOT_SET"
        );
    }
}