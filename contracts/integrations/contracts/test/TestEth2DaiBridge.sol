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

import "@0x/contracts-asset-proxy/contracts/src/bridges/Eth2DaiBridge.sol";


contract TestEth2DaiBridge is
    Eth2DaiBridge
{
    // solhint-disable var-name-mixedcase
    address public TEST_ETH2DAI_ADDRESS;

    constructor (address testEth2Dai)
        public
    {
        TEST_ETH2DAI_ADDRESS = testEth2Dai;
    }

    function _getEth2DaiAddress()
        internal
        view
        returns (address exchange)
    {
        return TEST_ETH2DAI_ADDRESS;
    }
}
