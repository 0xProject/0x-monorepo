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


// solhint-disable payable-fallback
contract TestLibProxyReceiver {

    function ()
        external
    {
        // Done in assembly to allow the return.
        assembly {
            let calldataSize := calldatasize()

            // Copy all calldata into memory.
            calldatacopy(0, 0, calldataSize)

            // If the calldatasize is equal to 4, revert.
            // This allows us to test `proxyCall` with reverts.
            if eq(calldataSize, 4) {
                revert(0, 4)
            }

            // Return. This allows us to test `proxyCall` with returns.
            return(0, calldataSize)
        }
    }
}
