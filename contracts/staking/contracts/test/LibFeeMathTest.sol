

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

import "../src/libs/LibFeeMath.sol";


contract LibFeeMathTest {
    
    function nthRoot(uint256 base, uint256 n) public pure returns (uint256 root) {
        return LibFeeMath._nthRoot(base, n);
    }

    function nthRootFixedPoint(
        uint256 base,
        uint256 n
    )
        public
        pure
        returns (uint256 root)
    {
        return LibFeeMath._nthRootFixedPoint(base, n);
    }

    function cobbDouglas(
        uint256 totalRewards,
        uint256 ownerFees,
        uint256 totalFees,
        uint256 ownerStake,
        uint256 totalStake,
        uint8 alphaNumerator,
        uint8 alphaDenominator
    )
        public
        pure
        returns (uint256)
    {
        return LibFeeMath._cobbDouglas(
            totalRewards,
            ownerFees,
            totalFees,
            ownerStake,
            totalStake,
            alphaNumerator,
            alphaDenominator
        );
    }

    function cobbDouglasSimplified(
        uint256 totalRewards,
        uint256 ownerFees,
        uint256 totalFees,
        uint256 ownerStake,
        uint256 totalStake,
        uint8 alphaDenominator
    )
        public
        pure
        returns (uint256)
    {
        return LibFeeMath._cobbDouglasSimplified(
            totalRewards,
            ownerFees,
            totalFees,
            ownerStake,
            totalStake,
            alphaDenominator
        );
    }

    function cobbDouglasSimplifiedInverse(
        uint256 totalRewards,
        uint256 ownerFees,
        uint256 totalFees,
        uint256 ownerStake,
        uint256 totalStake,
        uint8 alphaDenominator
    )
        public
       // pure
        returns (uint256)
    {
        return LibFeeMath._cobbDouglasSimplifiedInverse(
            totalRewards,
            ownerFees,
            totalFees,
            ownerStake,
            totalStake,
            alphaDenominator
        );
    }
}


