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

pragma solidity ^0.5.3;


contract MNonFungibleToken {

    /// @dev Returns true if token is non-fungible
    function isNonFungible(uint256 id) public pure returns(bool);

    /// @dev Returns true if token is fungible
    function isFungible(uint256 _d) public pure returns(bool);

    /// @dev Returns index of non-fungible token
    function getNonFungibleIndex(uint256 id) public pure returns(uint256);

    /// @dev Returns base type of non-fungible token
    function getNonFungibleBaseType(uint256 id) public pure returns(uint256);

    /// @dev Returns true if input is base-type of a non-fungible token
    function isNonFungibleBaseType(uint256 id) public pure returns(bool);

    /// @dev Returns true if input is a non-fungible token
    function isNonFungibleItem(uint256 id) public pure returns(bool);

    /// @dev returns owner of a non-fungible token
    function ownerOf(uint256 id) public view returns (address);
}
