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

import "../src/Staking.sol";


contract TestStaking is
    Staking
{
    address internal _wethAddress;

    constructor(address wethAddress) public {
        _wethAddress = wethAddress;
    }

    /// @dev Overridden to avoid hard-coded WETH.
    function getTotalBalance()
        external
        view
        returns (uint256 totalBalance)
    {
        totalBalance = address(this).balance;
    }

    /// @dev Overridden to use _wethAddress;
    function _getWETHAddress() internal view returns (address) {
        return _wethAddress;
    }
}
