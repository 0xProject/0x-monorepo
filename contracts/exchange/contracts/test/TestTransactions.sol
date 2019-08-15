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
pragma experimental ABIEncoderV2;

import "../src/Exchange.sol";
import "../src/MixinTransactions.sol";


contract TestTransactions is
    Exchange
{
    // Indicates whether or not the overridden _isValidTransactionWithHashSignature should return true or false.
    bool public shouldBeValid;

    // Indicates whether or not the fallback function should succeed.
    bool public shouldSucceedCall;

    // The returndata of the fallback function.
    bytes public fallbackReturnData;

    constructor ()
        public
        Exchange(1337)
    {} // solhint-disable-line no-empty-blocks

    // This fallback function will succeed if the bool `shouldSucceedCall` has been set
    // to true, and will fail otherwise. It will return returndata `fallbackReturnData`
    // in either case.
    function ()
        external
    {
        // Circumvent the compiler to return data through the fallback
        bool success = shouldSucceedCall;
        bytes memory returnData = fallbackReturnData;
        assembly {
            if or(iszero(success), gt(calldatasize, 0x0)) {
                revert(add(0x20, returnData), mload(returnData))
            }
            return(add(0x20, returnData), mload(returnData))
        }
    }

    function setCurrentContextAddress(address context)
        external
    {
        currentContextAddress = context;
    }

    function setFallbackReturnData(bytes calldata returnData)
        external
    {
        fallbackReturnData = returnData;
    }

    function setShouldBeValid(bool isValid)
        external
    {
        shouldBeValid = isValid;
    }

    function setShouldCallSucceed(bool shouldSucceed)
        external
    {
        shouldSucceedCall = shouldSucceed;
    }

    function setTransactionHash(bytes32 hash)
        external
    {
        transactionsExecuted[hash] = true;
    }

    function getCurrentContextAddress()
        external
        view
        returns (address)
    {
        return _getCurrentContextAddress();
    }

    function _isValidTransactionWithHashSignature(
        ZeroExTransaction memory,
        bytes32,
        address,
        bytes memory
    )
        internal
        view
        returns (bool)
    {
        return shouldBeValid;
    }
}
