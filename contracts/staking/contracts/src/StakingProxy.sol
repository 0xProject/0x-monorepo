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


contract StakingProxy is
    MixinStorage,
    IStakingProxy
{
    address constant NIL_ADDRESS = 0x0000000000000000000000000000000000000000;

    constructor(address _stakingContract)
        public
    {
        stakingContract = _stakingContract;
    }

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

    function attachStakingContract(address _stakingContract)
        external
        //ownerOnly
    {
        stakingContract = _stakingContract;
    }

    function detachStakingContract()
        external
        //ownerOnly
    {
        stakingContract = NIL_ADDRESS;
    }
}