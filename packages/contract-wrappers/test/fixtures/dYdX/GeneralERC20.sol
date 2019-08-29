/* Retrieved from https://raw.githubusercontent.com/dydxprotocol/exchange-wrappers/master/contracts/lib/GeneralERC20.sol
on August 29, 2019. */

/*

    Copyright 2018 dYdX Trading Inc.

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

pragma solidity 0.5.9;


/**
 * @title GeneralERC20
 * @author dYdX
 *
 * Interface for using ERC20 Tokens. We have to use a special interface to call ERC20 functions so
 * that we dont automatically revert when calling non-compliant tokens that have no return value for
 * transfer(), transferFrom(), or approve().
 */
interface GeneralERC20 {
    function totalSupply(
    )
        external
        view
        returns (uint256);

    function balanceOf(
        address who
    )
        external
        view
        returns (uint256);

    function allowance(
        address owner,
        address spender
    )
        external
        view
        returns (uint256);

    function transfer(
        address to,
        uint256 value
    )
        external;


    function transferFrom(
        address from,
        address to,
        uint256 value
    )
        external;

    function approve(
        address spender,
        uint256 value
    )
        external;
}
