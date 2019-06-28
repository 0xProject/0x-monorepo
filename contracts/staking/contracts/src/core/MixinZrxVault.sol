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

pragma solidity ^0.5.5;

import "../interfaces/IZrxVault.sol";
import "../immutable/MixinStorage.sol";


contract MixinZrxVault is
    MixinDeploymentConstants,
    MixinConstants,
    MixinStorage
{

    function setZrxVault(address _zrxVault)
        external
        // onlyOwner
    {
        zrxVault = IZrxVault(_zrxVault);
    }

    function getZrxVault()
        public
        view
        returns (address)
    {
        return address(zrxVault);
    }

    function _depositFromOwnerIntoZrxVault(address owner, uint256 amount)
        internal
    {
        zrxVault.depositFrom(owner, amount);
    }

    function _withdrawToOwnerFromZrxVault(address owner, uint256 amount)
        internal
    {
        zrxVault.withdrawFrom(owner, amount);
    }
}
