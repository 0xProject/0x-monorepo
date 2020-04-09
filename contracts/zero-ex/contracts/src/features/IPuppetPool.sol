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
pragma experimental ABIEncoderV2;

import "../puppets/IPuppet.sol";


/// @dev Feature to manage a pool of puppet workers.
interface IPuppetPool {

    /// @dev A new puppet contract was created.
    /// @param puppet The address of the puppet contract.
    event PuppetCreated(address puppet);

    /// @dev Create a new, free puppet to add to the pool. Anyone can call this.
    /// @return puppet The new puppet's address.
    function createFreePuppet() external returns (address puppet);

    /// @dev Acquire a new puppet instance. This removes the puppet from the
    ///      pool. If one is not available, a new one will be deployed.
    ///      Only callable from within.
    /// @return puppet The acquired puppet.
    function _acquirePuppet() external returns (IPuppet puppet);

    /// @dev Release an acquired puppet instance back into the pool.
    ///      Only callable from within.
    /// @param puppet The puppet to return to the pool.
    function _releasePuppet(IPuppet puppet) external;

    /// @dev Gets the number of free puppets in the pool.
    /// @return count The number of free puppets in the pool.
    function getFreePuppetsCount() external view returns (uint256 count);

    /// @dev Check if an address is a puppet instance.
    /// @param puppet The address to check.
    /// @return isPuppet_ `true` if `puppet` is a puppet instance.
    function isPuppet(address puppet) external view returns (bool isPuppet_);
}
