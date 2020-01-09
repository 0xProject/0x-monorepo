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


// solhint-disable no-empty-blocks
contract TestContractWrapper {

    uint256 constant public VALID_RETURN_VALUE = 0xf984f922a56ea9a20a32a32f0f60f2d216ff0c0a0d16c986a97a7f1897a6613b;

    function throwStringRevert() external returns (uint256) {
        revert("ERROR");
    }

    function throwEmptyRevert() external returns (uint256) {
        revert();
    }

    function throwInvalidOpcode() external returns (uint256) {
        assembly {
            invalid()
        }
    }

    function returnForcedEmpty() external returns (uint256) {
        assembly {
            return(0x60, 0)
        }
    }

    function returnTruncated() external returns (uint256) {
        uint256 v = VALID_RETURN_VALUE;
        assembly {
            mstore(0x0, v)
            return(0x0, 16)
        }
    }

    function returnEmpty() external { }

    function returnValid() external returns (uint256) {
        return VALID_RETURN_VALUE;
    }
}
