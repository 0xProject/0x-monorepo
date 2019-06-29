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

import "./immutable/MixinStorage.sol";
import "./interfaces/IStakingProxy.sol";
import "./sys/MixinOwnable.sol";


contract StakingProxy is
    IStakingProxy,
    MixinDeploymentConstants,
    MixinConstants,
    MixinStorage,
    MixinOwnable
{

    /// @dev Constructor.
    /// @param _stakingContract Staking contract to delegate calls to.
    constructor(address _stakingContract)
        public
    {
        owner = msg.sender;
        stakingContract = _stakingContract;
    }

    /// @dev Delegates calls to the staking contract, if it is set.
    // solhint-disable no-complex-fallback
    function ()
        external
        payable
    {
        address _stakingContract = stakingContract;
        if (_stakingContract == NIL_ADDRESS) {
            return;
        }

        assembly {
            // copy calldata to memory
            calldatacopy(
                0x0,
                0x0,
                calldatasize()
            )

            // delegate call into staking contract
            let success := delegatecall(
                gas,                    // forward all gas
                _stakingContract,       // calling staking contract
                0x0,                    // start of input (calldata)
                calldatasize(),         // length of input (calldata)
                0x0,                    // write output over input
                0                       // length of output is unknown
            )

            // copy return data to memory
            returndatacopy(
                0x0,
                0x0,
                returndatasize()
            )

            // rethrow any exceptions
            if iszero(success) {
                revert(0, returndatasize())
            }

            // return call results
            return(0, returndatasize())
        }
    }

    /// @dev Attach a staking contract; future calls will be delegated to the staking contract.
    /// Note that this is callable only by this contract's owner.
    /// @param _stakingContract Address of staking contract.
    function attachStakingContract(address _stakingContract)
        external
        onlyOwner
    {
        stakingContract = _stakingContract;
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
}