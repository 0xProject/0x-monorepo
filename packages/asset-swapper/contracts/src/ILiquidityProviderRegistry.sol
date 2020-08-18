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


interface ILiquidityProviderRegistry {

    /// @dev Returns the address of a liquidity provider for the given market
    ///      (takerToken, makerToken), reverting if the pool does not exist.
    /// @param takerToken Taker asset managed by liquidity provider.
    /// @param makerToken Maker asset managed by liquidity provider.
    /// @return Address of the liquidity provider.
    function getLiquidityProviderForMarket(
        address takerToken,
        address makerToken
    )
        external
        view
        returns (address providerAddress);
}
