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

pragma solidity ^0.4.21;
pragma experimental ABIEncoderV2;

contract LibBalances {
    
    // TODO: If we turn this into Balance[256] then maybe
    // we don't pay for all the memory for the higher indices that
    // we don't access.
    struct Balance {
        address token;
        address owner;
        int256 balance;
    }
    
    function add(
        Balances[256] memory balances,
        uint8 index,
        address token,
        address owner,
        int256 amount)
        public
    {
        Balance memory balance = balances[index];
        if(balance.token == address(0x0)) {
            require(token != address(0x0));
            balance.token = token;
            balance.owner = owner;
        } else {
            require(balance.token == token);
            require(balance.owner == owner);
        }
        require(amount > -2**128);
        require(amount < +2**128);
        balances.balance += amount;
    }
}
