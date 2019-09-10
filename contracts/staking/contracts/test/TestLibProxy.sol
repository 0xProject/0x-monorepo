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

/**********************************************

   THIS IS AN EXTREMELY DANGEROUS CONTRACT!

   IT IS ONLY INTENDED FOR TESTING AND SHOULD
       NEVER BE USED IN PRODUCTION!

**********************************************/

pragma solidity ^0.5.9;
pragma experimental ABIEncoderV2;

import "../src/libs/LibProxy.sol";


contract TestLibProxy {

    using LibProxy for address;

    /// @dev Exposes the `proxyCall()` library function from LibProxy.
    /// @param destination Address to call.
    /// @param revertRule Describes scenarios in which this function reverts.
    /// @param customEgressSelector Custom selector used to call destination contract.
    /// @param ignoreIngressSelector Ignore the selector used to call into this contract.
    function externalProxyCall(
        address destination,
        LibProxy.RevertRule revertRule,
        bytes4 customEgressSelector,
        bool ignoreIngressSelector
    )
        external
    {
        destination.proxyCall(
            revertRule,
            customEgressSelector,
            ignoreIngressSelector
        );
    }
}
