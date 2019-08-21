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

import "@0x/contracts-exchange-libs/contracts/src/LibZeroExTransaction.sol";
import "../src/Exchange.sol";


contract TestTransactions is
    Exchange
{
    event ExecutableCalled(bytes data, bytes returnData);

    constructor ()
        public
        Exchange(1337)
    {} // solhint-disable-line no-empty-blocks

    function setCurrentContextAddress(address context)
        external
    {
        currentContextAddress = context;
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

    function assertExecutableTransaction(
        LibZeroExTransaction.ZeroExTransaction memory transaction,
        bytes memory signature
    )
        public
        view
    {
        return _assertExecutableTransaction(
            transaction,
            signature,
            transaction.getTypedDataHash(EIP712_EXCHANGE_DOMAIN_HASH)
        );
    }

    // This function will execute arbitrary calldata via a delegatecall. This is highly unsafe to use in production, and this
    // is only meant to be used during testing.
    function executable(
        bool shouldSucceed,
        bytes memory data,
        bytes memory returnData
    )
        public
        returns (bytes memory)
    {
        emit ExecutableCalled(data, returnData);
        require(shouldSucceed, "EXECUTABLE_FAILED");
        if (data.length != 0) {
            (bool didSucceed, bytes memory callResultData) = address(this).delegatecall(data); // This is a delegatecall to preserve the `msg.sender` field
            if (!didSucceed) {
                assembly { revert(add(callResultData, 0x20), mload(callResultData)) }
            }
        }
        return returnData;
    }

    function _isValidTransactionWithHashSignature(
        LibZeroExTransaction.ZeroExTransaction memory,
        bytes32,
        bytes memory signature
    )
        internal
        view
        returns (bool)
    {
        if (
            signature.length == 2 &&
            signature[0] == 0x0 &&
            signature[1] == 0x0
        ) {
            return false;
        }
        return true;
    }
}
