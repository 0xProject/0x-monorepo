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


interface IRewardVault {



    function depositFor(bytes32 poolId)
        external
        payable;

    function recordDepositFor(bytes32 poolId, uint256 amount)
        external;

/*
    function deposit()
        external
        payable;

    function ()
        external
        payable;
    */

    function withdrawFromOperator(bytes32 poolId, uint256 amount)
        external;

    function withdrawFromPool(bytes32 poolId, uint256 amount)
        external;

    function balanceOf(bytes32 poolId)
        external
        view
        returns (uint256);

    function operatorBalanceOf(bytes32 poolId)
        external
        view
        returns (uint256);

    function poolBalanceOf(bytes32 poolId)
        external
        view
        returns (uint256);

    function createPool(bytes32 poolId, address payable poolOperator, uint8 poolOperatorShare)
        external;

    function getPoolOperator(bytes32 poolId)
        external
        view
        returns (address);
}
