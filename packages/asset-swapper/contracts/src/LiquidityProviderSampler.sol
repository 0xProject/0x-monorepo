/*

  Copyright 2020 ZeroEx Intl.

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

pragma solidity ^0.6;
pragma experimental ABIEncoderV2;

import "@0x/contracts-utils/contracts/src/v06/LibBytesV06.sol";
import "./interfaces/ILiquidityProvider.sol";
import "./interfaces/ILiquidityProviderRegistry.sol";
import "./ApproximateBuys.sol";
import "./SamplerUtils.sol";


contract LiquidityProviderSampler is
    SamplerUtils,
    ApproximateBuys
{
    /// @dev Default gas limit for liquidity provider calls.
    uint256 constant private DEFAULT_CALL_GAS = 400e3; // 400k

    /// @dev Sample sell quotes from an arbitrary on-chain liquidity provider.
    /// @param registryAddress Address of the liquidity provider registry contract.
    /// @param takerToken Address of the taker token (what to sell).
    /// @param makerToken Address of the maker token (what to buy).
    /// @param takerTokenAmounts Taker token sell amount for each sample.
    /// @return makerTokenAmounts Maker amounts bought at each taker token
    ///         amount.
    function sampleSellsFromLiquidityProviderRegistry(
        address registryAddress,
        address takerToken,
        address makerToken,
        uint256[] memory takerTokenAmounts
    )
        public
        view
        returns (uint256[] memory makerTokenAmounts, address providerAddress)
    {
        // Initialize array of maker token amounts.
        uint256 numSamples = takerTokenAmounts.length;
        makerTokenAmounts = new uint256[](numSamples);

        // Query registry for provider address.
        providerAddress = _getLiquidityProviderFromRegistry(
            registryAddress,
            takerToken,
            makerToken
        );
        // If provider doesn't exist, return all zeros.
        if (providerAddress == address(0)) {
            return (makerTokenAmounts, providerAddress);
        }

        for (uint256 i = 0; i < numSamples; i++) {
            try
                ILiquidityProvider(providerAddress).getSellQuote
                    {gas: DEFAULT_CALL_GAS}
                    (takerToken, makerToken, takerTokenAmounts[i])
                returns (uint256 amount)
            {
                makerTokenAmounts[i] = amount;
            } catch (bytes memory) {
                // Swallow failures, leaving all results as zero.
                break;
            }
        }
    }

    /// @dev Sample buy quotes from an arbitrary on-chain liquidity provider.
    /// @param registryAddress Address of the liquidity provider registry contract.
    /// @param takerToken Address of the taker token (what to sell).
    /// @param makerToken Address of the maker token (what to buy).
    /// @param makerTokenAmounts Maker token buy amount for each sample.
    /// @return takerTokenAmounts Taker amounts sold at each maker token
    ///         amount.
    function sampleBuysFromLiquidityProviderRegistry(
        address registryAddress,
        address takerToken,
        address makerToken,
        uint256[] memory makerTokenAmounts
    )
        public
        view
        returns (uint256[] memory takerTokenAmounts, address providerAddress)
    {
        providerAddress = _getLiquidityProviderFromRegistry(
            registryAddress,
            takerToken,
            makerToken
        );
        takerTokenAmounts = _sampleApproximateBuys(
            ApproximateBuyQuoteOpts({
                makerTokenData: abi.encode(makerToken, registryAddress),
                takerTokenData: abi.encode(takerToken, registryAddress),
                getSellQuoteCallback: _sampleSellForApproximateBuyFromLiquidityProviderRegistry
            }),
            makerTokenAmounts
        );
    }

    /// @dev Returns the address of a liquidity provider for the given market
    ///      (takerToken, makerToken), from a registry of liquidity providers.
    ///      Returns address(0) if no such provider exists in the registry.
    /// @param takerToken Taker asset managed by liquidity provider.
    /// @param makerToken Maker asset managed by liquidity provider.
    /// @return providerAddress Address of the liquidity provider.
    function _getLiquidityProviderFromRegistry(
        address registryAddress,
        address takerToken,
        address makerToken
    )
        private
        view
        returns (address providerAddress)
    {
        if (registryAddress == address(0)) {
            return address(0);
        }
        try
            ILiquidityProviderRegistry(registryAddress).getLiquidityProviderForMarket
                (takerToken, makerToken)
            returns (address provider)
        {
            return provider;
        } catch (bytes memory) {
            // Swallow failures, leaving all results as zero.
            return address(0);
        }
    }

    function _sampleSellForApproximateBuyFromLiquidityProviderRegistry(
        bytes memory takerTokenData,
        bytes memory makerTokenData,
        uint256 sellAmount
    )
        private
        view
        returns (uint256 buyAmount)
    {
        (address takerToken, address plpRegistryAddress) =
            abi.decode(takerTokenData, (address, address));
        (address makerToken) =
            abi.decode(makerTokenData, (address));
        try
            this.sampleSellsFromLiquidityProviderRegistry
                {gas: DEFAULT_CALL_GAS}
                (plpRegistryAddress, takerToken, makerToken, _toSingleValueArray(sellAmount))
            returns (uint256[] memory amounts, address)
        {
            return amounts[0];
        } catch (bytes memory) {
            // Swallow failures, leaving all results as zero.
            return 0;
        }
    }
}
