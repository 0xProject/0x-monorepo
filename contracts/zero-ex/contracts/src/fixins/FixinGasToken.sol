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

pragma solidity ^0.6.5;

import "../vendor/v3/IGasToken.sol";

contract FixinGasToken
{
    /// @dev Mainnet address of the GST2 contract
    address constant private GST_ADDRESS = 0x0000000000b3F879cb30FE243b4Dfee438691c04;
    /// @dev Mainnet address of the GST Collector
    address constant private GST_COLLECTOR_ADDRESS = 0x000000D3b08566BE75A6DB803C03C85C0c1c5B96;

    /// @dev Frees gas tokens using the balance of `from`. Amount freed is based
    ///     on the gas consumed in the function
    modifier freesGasTokensFromCollector() {
        uint256 gasBefore = gasleft();
        _;
        // (gasUsed + FREE_BASE) / (2 * REIMBURSE - FREE_TOKEN)
        //            14154             24000        6870
        uint256 value = (gasBefore - gasleft() + 14154) / 41130;
        GST_ADDRESS.call(
            abi.encodeWithSelector(
                IGasToken(address(0)).freeFromUpTo.selector,
                GST_COLLECTOR_ADDRESS,
                value
            )
        );
    }
}
