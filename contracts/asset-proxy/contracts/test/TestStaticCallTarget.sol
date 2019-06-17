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

pragma solidity ^0.5.9;

import "@0x/contracts-utils/contracts/src/LibBytes.sol";


contract TestStaticCallTarget {

    using LibBytes for bytes;

    uint256 internal _state;
 
    function updateState()
        external
    {
        _state++;
    }

    function assertEvenNumber(uint256 target)
        external
        pure
    {
        require(
            target % 2 == 0,
            "TARGET_NOT_EVEN"
        );
    }

    function isOddNumber(uint256 target)
        external
        pure
        returns (bool isOdd)
    {
        isOdd = target % 2 == 1;
        return isOdd;
    }

    function noInputFunction()
        external
        pure
    {
        assert(msg.data.length == 4 && msg.data.readBytes4(0) == bytes4(keccak256("noInputFunction()")));
    }

    function dynamicInputFunction(bytes calldata a)
        external
        pure
    {
        bytes memory abiEncodedData = abi.encodeWithSignature("dynamicInputFunction(bytes)", a);
        assert(msg.data.equals(abiEncodedData));
    }

    function returnComplexType(uint256 a, uint256 b)
        external
        view
        returns (bytes memory result)
    {
        result = abi.encodePacked(
            address(this),
            a,
            b
        );
        return result;
    }
}