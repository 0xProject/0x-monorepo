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

import "./mixins/MStake.sol";
import "./interfaces/IVault.sol";
import "./libs/LibZrxToken.sol";
import "@0x/contracts-utils/contracts/src/SafeMath.sol";


contract MixinStake is
    MStake,
    SafeMath
{
    using LibZrxToken for uint256;

    // default maker id that stake is delegated to
    bytes32 constant internal NIL_MAKER_ID = 0x0;

    // mapping from Staker to Maker Id to Amount Staked
    mapping (address => mapping (bytes32 => uint256)) delegatedStake;

    // mapping from Staker to Maker Id to Amount Staked
    mapping (address => uint256) totalStake;

    // ZRX vault
    IVault zrxVault;

    constructor(address _zrxVault) public {
        zrxVault = IVault(_zrxVault);
    }

    function stake(uint256 amount)
        external
        returns (uint256)
    {
        // sanitize input - can only stake whole tokens
        uint256 amountOfStakeToMint = amount._roundDownToNearestWholeToken();

        // deposit equivalent amount of ZRX into vault
        zrxVault.depositFrom(msg.sender, amountOfStakeToMint);

        // mint stake
        totalStake[msg.sender] = _safeAdd(totalStake[msg.sender], amountOfStakeToMint);
        delegatedStake[msg.sender][NIL_MAKER_ID] = _safeAdd(delegatedStake[msg.sender][NIL_MAKER_ID], amountOfStakeToMint);

        // return amount of stake minted
        return amountOfStakeToMint;
    }

    function unstake(uint256 amount)
        external
        returns (uint256)
    {
        // sanitize input - can only stake whole tokens
        uint256 amountOfStakeToBurn = amount._roundDownToNearestWholeToken();

        // burn stake
        totalStake[msg.sender] = _safeSub(totalStake[msg.sender], amountOfStakeToBurn);
        delegatedStake[msg.sender][NIL_MAKER_ID] = _safeSub(delegatedStake[msg.sender][NIL_MAKER_ID], amountOfStakeToBurn);

        // withdraw equivalent amount of ZRX from vault
        zrxVault.withdrawFrom(msg.sender, amountOfStakeToBurn);

        // return amount of stake minted
        return amountOfStakeToBurn;
    }

    function getStakeBalance(address owner)
        external
        view
        returns (uint256)
    {
        return totalStake[owner];
    }
}
