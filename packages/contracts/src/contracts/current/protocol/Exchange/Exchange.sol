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

pragma solidity ^0.4.21;
pragma experimental ABIEncoderV2;

import "./MixinExchangeCore.sol";
import "./MixinSignatureValidator.sol";
import "./MixinSettlement.sol";
import "./MixinWrapperFunctions.sol";
import "./MixinAssetProxyDispatcher.sol";

contract Exchange is
    MixinExchangeCore,
    MixinSignatureValidator,
    MixinSettlement,
    MixinWrapperFunctions,
    MixinAssetProxyDispatcher
{
    string constant public VERSION = "2.0.1-alpha";

    function Exchange(
        bytes memory _zrxProxyData)
        public
        MixinExchangeCore()
        MixinSignatureValidator()
        MixinSettlement(_zrxProxyData)
        MixinWrapperFunctions()
        MixinAssetProxyDispatcher()
    {}
}
