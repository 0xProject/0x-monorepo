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

pragma solidity ^0.5.16;

import "@0x/contracts-utils/contracts/src/DeploymentConstants.sol";
import "../interfaces/IGasToken.sol";


contract MixinGasToken is
    DeploymentConstants
{

    /// @dev Frees gas tokens based on the amount of gas consumed in the function
    modifier freesGasTokens {
        uint256 gasBefore = gasleft();
        _;
        IGasToken gst = IGasToken(_getGstAddress());
        if (address(gst) != address(0)) {
            // (gasUsed + FREE_BASE) / (2 * REIMBURSE - FREE_TOKEN)
            //            14154             24000        6870
            uint256 value = (gasBefore - gasleft() + 14154) / 41130;
            gst.freeUpTo(value);
        }
    }

    /// @dev Frees gas tokens using the balance of `from`. Amount freed is based
    ///     on the gas consumed in the function
    modifier freesGasTokensFromCollector() {
        uint256 gasBefore = gasleft();
        _;
        IGasToken gst = IGasToken(_getGstAddress());
        if (address(gst) != address(0)) {
            // (gasUsed + FREE_BASE) / (2 * REIMBURSE - FREE_TOKEN)
            //            14154             24000        6870
            uint256 value = (gasBefore - gasleft() + 14154) / 41130;
            gst.freeFromUpTo(_getGstCollectorAddress(), value);
        }
    }
}
