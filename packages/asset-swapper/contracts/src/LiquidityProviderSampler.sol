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

import "@0x/contracts-utils/contracts/src/LibBytes.sol";
import "./ILiquidityProvider.sol";
import "./ILiquidityProviderRegistry.sol";
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
        returns (uint256[] memory makerTokenAmounts)
    {
        // Initialize array of maker token amounts.
        uint256 numSamples = takerTokenAmounts.length;
        makerTokenAmounts = new uint256[](numSamples);

        // Query registry for provider address.
        address providerAddress = getLiquidityProviderFromRegistry(
            registryAddress,
            takerToken,
            makerToken
        );
        // If provider doesn't exist, return all zeros.
        if (providerAddress == address(0)) {
            return makerTokenAmounts;
        }

        for (uint256 i = 0; i < numSamples; i++) {
            (bool didSucceed, bytes memory resultData) =
                providerAddress.staticcall.gas(DEFAULT_CALL_GAS)(
                    abi.encodeWithSelector(
                        ILiquidityProvider(0).getSellQuote.selector,
                        takerToken,
                        makerToken,
                        takerTokenAmounts[i]
                    ));
            uint256 buyAmount = 0;
            if (didSucceed) {
                buyAmount = abi.decode(resultData, (uint256));
            } else {
                // Exit early if the amount is too high for the liquidity provider to serve
                break;
            }
            makerTokenAmounts[i] = buyAmount;
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
        returns (uint256[] memory takerTokenAmounts)
    {
        return _sampleApproximateBuys(
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
    function getLiquidityProviderFromRegistry(
        address registryAddress,
        address takerToken,
        address makerToken
    )
        public
        view
        returns (address providerAddress)
    {
        bytes memory callData = abi.encodeWithSelector(
            ILiquidityProviderRegistry(0).getLiquidityProviderForMarket.selector,
            takerToken,
            makerToken
        );
        (bool didSucceed, bytes memory returnData) = registryAddress.staticcall(callData);
        if (didSucceed && returnData.length == 32) {
            return LibBytes.readAddress(returnData, 12);
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
        (bool success, bytes memory resultData) =
            address(this).staticcall(abi.encodeWithSelector(
                this.sampleSellsFromLiquidityProviderRegistry.selector,
                plpRegistryAddress,
                takerToken,
                makerToken,
                _toSingleValueArray(sellAmount)
            ));
        if (!success) {
            return 0;
        }
        // solhint-disable-next-line indent
        return abi.decode(resultData, (uint256[]))[0];
    }
}
