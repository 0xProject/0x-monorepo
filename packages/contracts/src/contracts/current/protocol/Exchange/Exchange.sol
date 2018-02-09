/*

  Copyright 2017 ZeroEx Intl.

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

pragma solidity ^0.4.19;

import "./MixinExchangeCore.sol";
import "./MixinSignatureValidatorEcrecover.sol";
import "./MixinSettlementProxy.sol";
import "./MixinWrapperFunctions.sol";

contract Exchange is
    MixinExchangeCore,
    MixinSignatureValidatorEcrecover,
    MixinSettlementProxy,
    MixinWrapperFunctions
{
    string constant public VERSION = "2.0.1-alpha";

    function Exchange(address _zrxToken, address _tokenTransferProxy)
        public
        MixinExchangeCore()
        MixinSignatureValidatorEcrecover()
        MixinSettlementProxy(_tokenTransferProxy, _zrxToken)
        MixinWrapperFunctions()
    {
    }
}
