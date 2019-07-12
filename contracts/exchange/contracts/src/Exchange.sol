/*

  Copyright 2018 ZeroEx Intl.

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

import "./MixinMatchOrders.sol";
import "./MixinSignatureValidator.sol";
import "./MixinWrapperFunctions.sol";
import "./MixinTransferSimulator.sol";


// solhint-disable no-empty-blocks
// MixinAssetProxyDispatcher, MixinExchangeCore, MixinExchangeRichErrors,
// and MixinTransactions are all inherited via the other Mixins that are
// used.
contract Exchange is
    MixinSignatureValidator,
    MixinMatchOrders,
    MixinWrapperFunctions,
    MixinTransferSimulator
{
    string constant public VERSION = "3.0.0";

    /// @dev Mixins are instantiated in the order they are inherited
    /// @param chainId Chain ID of the network this contract is deployed on.
    constructor (uint256 chainId)
        public
        LibEIP712ExchangeDomain(chainId, address(0))
        MixinExchangeCore()
        MixinMatchOrders()
        MixinSignatureValidator()
        MixinTransactions()
        MixinAssetProxyDispatcher()
        MixinTransferSimulator()
        MixinWrapperFunctions()
    {}
}
