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

import "@0x/contracts-utils/contracts/src/Authorizable.sol";


contract MixinVaultCore is
    Authorizable
{

    address payable internal stakingContractAddress;

    bool internal isInCatostrophicFailure;

    constructor() public {
        stakingContractAddress = 0x0000000000000000000000000000000000000000;
        isInCatostrophicFailure = false;
    }

    modifier onlyStakingContract {
        require(
            msg.sender == stakingContractAddress,
            "ONLY_CALLABLE_BY_STAKING_CONTRACT"
        );
        _;
    }

    modifier onlyInCatostrophicFailure {
        require(
            isInCatostrophicFailure,
            "ONLY_CALLABLE_IN_CATOSTROPHIC_FAILURE"
        );
        _;
    }

    modifier onlyNotInCatostrophicFailure {
        require(
            !isInCatostrophicFailure,
            "ONLY_CALLABLE_NOT_IN_CATOSTROPHIC_FAILURE"
        );
        _;
    }

    function setStakingContractAddrsess(address payable _stakingContractAddress)
        external
        onlyOwner
    {
        stakingContractAddress = _stakingContractAddress;
    }

    function enterCatostrophicFailure()
        external
        onlyOwner
    {
        isInCatostrophicFailure = true;
    }
}