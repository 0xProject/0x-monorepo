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


// solhint-disable payable-fallback
contract TestLibProxy {

    using LibProxy for address;

    // The arguments of `proxyCall()`.
    struct ProxyCallArguments {
        address destination;
        LibProxy.RevertRule revertRule;
        bytes4 customEgressSelector;
        bool ignoreIngressSelector;
    }

    // The current arguments that should be passed in the call to `proxyCall()`. This
    // state allows us to send in the exact calldata that should be sent to `proxyCall()`
    // while still being able to test any combination of inputs to `proxyCall()`.
    ProxyCallArguments internal proxyCallArgs;

    /// @dev Exposes the `proxyCall()` library function from LibProxy.
    function ()
        external
    {
        proxyCallArgs.destination.proxyCall(
            proxyCallArgs.revertRule,
            proxyCallArgs.customEgressSelector,
            proxyCallArgs.ignoreIngressSelector
        );
    }

    /// @dev Calls back into this contract with the calldata that should be sent in the call
    ///      to `proxyCall()` after setting the `proxyCallArgs` appropriately.
    /// @param args The struct that should be set to `proxyCallArgs`.
    /// @param data The bytes that should be used to call back into this contract.
    function publicProxyCall(ProxyCallArguments memory args, bytes memory data)
        public
        returns (bool success, bytes memory returnData)
    {
        proxyCallArgs = args;
        (success, returnData) = address(this).call(data);
    }

    /// @dev Calls the destination with the provided calldata.
    /// @param destination The contract that should be called by the proxy call.
    /// @param data The bytes that should be used to call into the destination contract.
    function publicSimpleProxyCallWithData(address destination, bytes memory data)
        public
        returns (bool success, bytes memory returnData)
    {
        return destination.simpleProxyCallWithData(data);
    }
}
