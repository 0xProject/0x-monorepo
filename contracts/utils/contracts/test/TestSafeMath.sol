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

import "../src/SafeMath.sol";


contract TestSafeMath is
    SafeMath
{
    function externalSafeMul(uint256 a, uint256 b)
        external
        pure
        returns (uint256)
    {
        return _safeMul(a, b);
    }

    function externalSafeSub(uint256 a, uint256 b)
        external
        pure
        returns (uint256)
    {
        return _safeSub(a, b);
    }

    function externalSafeAdd(uint256 a, uint256 b)
        external
        pure
        returns (uint256)
    {
        return _safeAdd(a, b);
    }

    function externalMaxUint256(uint256 a, uint256 b)
        external
        pure
        returns (uint256)
    {
        return _max256(a, b);
    }

    function externalMinUint256(uint256 a, uint256 b)
        external
        pure
        returns (uint256)
    {
        return _min256(a, b);
    }
}
