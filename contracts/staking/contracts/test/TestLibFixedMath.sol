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

import "../src/libs/LibFixedMath.sol";


contract TestLibFixedMath {

    function one() external pure returns (int256) {
        return LibFixedMath._one();
    }

    function mul(int256 a, int256 b) external pure returns (int256) {
        return LibFixedMath._mul(a, b);
    }

    function div(int256 a, int256 b) external pure returns (int256) {
        return LibFixedMath._div(a, b);
    }

    function add(int256 a, int256 b) external pure returns (int256) {
        return LibFixedMath._add(a, b);
    }

    function sub(int256 a, int256 b) external pure returns (int256) {
        return LibFixedMath._sub(a, b);
    }

    function uintMul(int256 f, uint256 u) external pure returns (uint256) {
        return LibFixedMath._uintMul(f, u);
    }

    function abs(int256 a) external pure returns (int256) {
        return LibFixedMath._abs(a);
    }

    function toFixedSigned(int256 n, int256 d) external pure returns (int256) {
        return LibFixedMath._toFixed(n, d);
    }

    function toFixedSigned(int256 n) external pure returns (int256) {
        return LibFixedMath._toFixed(n);
    }

    function toFixedUnsigned(uint256 n, uint256 d) external pure returns (int256) {
        return LibFixedMath._toFixed(n, d);
    }

    function toFixedUnsigned(uint256 n) external pure returns (int256) {
        return LibFixedMath._toFixed(n);
    }

    function toInteger(int256 f) external pure returns (int256) {
        return LibFixedMath._toInteger(f);
    }

    function ln(int256 x) external pure returns (int256 r) {
        return LibFixedMath._ln(x);
    }

    function exp(int256 x) external pure returns (int256 r) {
        return LibFixedMath._exp(x);
    }
}
