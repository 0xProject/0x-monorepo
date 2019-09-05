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

import "./libs/LibProxy.sol";
import "./immutable/MixinStorage.sol";
import "./interfaces/IStakingProxy.sol";


contract StakingProxy is
    IStakingProxy,
    MixinDeploymentConstants,
    MixinConstants,
    MixinStorage
{
    using LibProxy for address;

    /// @dev Constructor.
    /// @param _stakingContract Staking contract to delegate calls to.
    constructor(address _stakingContract, address _readOnlyProxy)
        public
        MixinStorage()
    {
        stakingContract = _stakingContract;
        readOnlyProxyCallee = _stakingContract;
        readOnlyProxy = _readOnlyProxy;
    }

    /// @dev Delegates calls to the staking contract, if it is set.
    function ()
        external
        payable
    {
        stakingContract.proxyCall(
            LibProxy.RevertRule.REVERT_ON_ERROR,
            bytes4(0),                              // no custom selector
            false                                   // do not ignore this selector
        );
    }

    /// @dev Attach a staking contract; future calls will be delegated to the staking contract.
    /// Note that this is callable only by this contract's owner.
    /// @param _stakingContract Address of staking contract.
    function attachStakingContract(address _stakingContract)
        external
        onlyOwner
    {
        stakingContract = _stakingContract;
        readOnlyProxyCallee = _stakingContract;
        emit StakingContractAttachedToProxy(_stakingContract);
    }

    /// @dev Detach the current staking contract.
    /// Note that this is callable only by this contract's owner.
    function detachStakingContract()
        external
        onlyOwner
    {
        stakingContract = NIL_ADDRESS;
        emit StakingContractDetachedFromProxy();
    }

    /// @dev Set read-only mode (state cannot be changed).
    function setReadOnlyMode(bool readOnlyMode)
        external
        onlyOwner
    {
        if (readOnlyMode) {
            stakingContract = readOnlyProxy;
        } else {
            stakingContract = readOnlyProxyCallee;
        }

        emit ReadOnlyModeSet(readOnlyMode);
    }
}
