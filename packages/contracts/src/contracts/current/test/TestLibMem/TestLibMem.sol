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

pragma solidity ^0.4.24;

import "../../utils/LibMem/LibMem.sol";
import "../../utils/LibBytes/LibBytes.sol";

contract TestLibMem is
    LibMem,
    LibBytes
{

    function test1()
        external
    {
        // Length of array & length to copy
        uint256 length = 0;

        // Create source array
        bytes memory sourceArray = new bytes(length);

        // Create dest array with same contents as source array
        bytes memory destArray = new bytes(length);
        memcpy(
            getMemAddress(destArray) + 32,   // skip copying array length
            getMemAddress(sourceArray) + 32, // skip copying array length
            length
        );

        // Verify contents of source & dest arrays match
        require(
            areBytesEqual(sourceArray, destArray),
            "Test #1 failed. Array contents are not the same."
        );
    }

    function test2()
        external
    {
        // Length of array & length to copy
        uint256 length = 1;

        // Create source array
        bytes memory sourceArray = new bytes(length);
        sourceArray[0] = byte(1);

        // Create dest array with same contents as source array
        bytes memory destArray = new bytes(length);
        memcpy(
            getMemAddress(destArray) + 32,   // skip copying array length
            getMemAddress(sourceArray) + 32, // skip copying array length
            length
        );

        // Verify contents of source & dest arrays match
        require(
            areBytesEqual(sourceArray, destArray),
            "Test #2 failed. Array contents are not the same."
        );
    }

    function test3()
        external
    {
        // Length of array & length to copy
        uint256 length = 11;

        // Create source array
        bytes memory sourceArray = new bytes(length);
        for(uint256 i = 0; i < length; ++i) {
            sourceArray[i] = byte((i % 0xF) + 1); // [1..f]
        }

        // Create dest array with same contents as source array
        bytes memory destArray = new bytes(length);
        memcpy(
            getMemAddress(destArray) + 32,   // skip copying array length
            getMemAddress(sourceArray) + 32, // skip copying array length
            length
        );

        // Verify contents of source & dest arrays match
        require(
            areBytesEqual(sourceArray, destArray),
            "Test #3 failed. Array contents are not the same."
        );
    }

    function test4()
        external
    {
        // Length of array & length to copy
        uint256 length = 32;

        // Create source array
        bytes memory sourceArray = new bytes(length);
        for(uint256 i = 0; i < length; ++i) {
            sourceArray[i] = byte((i % 0xF) + 1); // [1..f]
        }

        // Create dest array with same contents as source array
        bytes memory destArray = new bytes(length);
        memcpy(
            getMemAddress(destArray) + 32,   // skip copying array length
            getMemAddress(sourceArray) + 32, // skip copying array length
            length
        );

        // Verify contents of source & dest arrays match
        require(
            areBytesEqual(sourceArray, destArray),
            "Test #4 failed. Array contents are not the same."
        );
    }

    function test5()
        external
    {
        // Length of array & length to copy
        uint256 length = 72;

        // Create source array
        bytes memory sourceArray = new bytes(length);
        for(uint256 i = 0; i < length; ++i) {
            sourceArray[i] = byte((i % 0xF) + 1); // [1..f]
        }

        // Create dest array with same contents as source array
        bytes memory destArray = new bytes(length);
        memcpy(
            getMemAddress(destArray) + 32,   // skip copying array length
            getMemAddress(sourceArray) + 32, // skip copying array length
            length
        );

        // Verify contents of source & dest arrays match
        require(
            areBytesEqual(sourceArray, destArray),
            "Test #5 failed. Array contents are not the same."
        );
    }


    function test6()
        external
    {
        // Length of arrays
        uint256 length1 = 72;
        uint256 length2 = 100;

        // The full source array is used for comparisons at the end
        bytes memory fullSourceArray = new bytes(length1 + length2);

        // First source array
        bytes memory sourceArray1 = new bytes(length1);
        for(uint256 i = 0; i < length1; ++i) {
            sourceArray1[i] = byte((i % 0xF) + 1); // [1..f]
            fullSourceArray[i] = byte((i % 0xF) + 1); // [1..f]
        }

        // Second source array
        bytes memory sourceArray2 = new bytes(length2);
        for(uint256 j = 0; i < length2; ++i) {
            sourceArray2[j] = byte((j % 0xF) + 1); // [1..f]
            fullSourceArray[length1+j] = byte((j % 0xF) + 1); // [1..f]
        }

        // Create dest array with same contents as source arrays
        bytes memory destArray = new bytes(length1 + length2);
        memcpy(
            getMemAddress(destArray) + 32,    // skip copying array length
            getMemAddress(sourceArray1) + 32, // skip copying array length
            length1
        );
        memcpy(
            getMemAddress(destArray) + 32 + length1,   // skip copying array length + sourceArray1 bytes
            getMemAddress(sourceArray2) + 32,          // skip copying array length
            length2
        );

        // Verify contents of source & dest arrays match
        require(
            areBytesEqual(fullSourceArray, destArray),
            "Test #6 failed. Array contents are not the same."
        );
    }

    function test7()
        external
    {
        // Length of array & length to copy
        uint256 length = 72;

        // Create source array
        bytes memory sourceArray = new bytes(length);
        for(uint256 i = 0; i < length; ++i) {
            sourceArray[i] = byte((i % 0xF) + 1); // [1..f]
        }

        // Create dest array with same contents as source array
        bytes memory destArray = new bytes(length);
        memcpy(
            getMemAddress(destArray) + 32,   // skip copying array length
            getMemAddress(sourceArray) + 32, // skip copying array length
            length - 8                       // Copy all but last byte.
        );

        // Verify contents of source & dest arrays match
        // We expect this to fail
        require(
            areBytesEqual(sourceArray, destArray),
            "Test #7 failed. Array contents are not the same. This is expected."
        );
    }
}
