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
import "@0x/contracts-erc20/contracts/src/interfaces/IEtherToken.sol";

contract TestStaking is
    Staking
{
    address public testWethAddress;

    constructor(address wethAddress) public {
        testWethAddress = wethAddress;
    }

    /// @dev Overridden to use testWethAddress;
    function _getWethContract()
        internal
        view
        returns (IEtherToken)
    {
        // `testWethAddress` will not be set on the proxy this contract is
        // attached to, so we need to access the storage of the deployed
        // instance of this contract.
        address wethAddress = TestStaking(address(uint160(stakingContract))).testWethAddress();
        return IEtherToken(wethAddress);
    }

    function _getWethAssetData()
        internal
        view
        returns (bytes memory)
    {
        address wethAddress = TestStaking(address(uint160(stakingContract))).testWethAddress();
        return abi.encodeWithSelector(
            IAssetData(address(0)).ERC20Token.selector,
            wethAddress
        ); 
    }
}
