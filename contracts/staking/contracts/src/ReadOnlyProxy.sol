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

import "./immutable/MixinStorage.sol";
import "./libs/LibProxy.sol";


contract ReadOnlyProxy is
    MixinStorage
{

    using LibProxy for address;

    // solhint-disable payable-fallback
    /// @dev Executes a read-only call to the staking contract, via `revertDelegateCall`.
    ///      By routing through `revertDelegateCall` any state changes are reverted.
    // solhint-disable-next-line payable-fallback
    function ()
        external
    {
        address(this).proxyCall(
            LibProxy.RevertRule.NEVER_REVERT,
            this.revertDelegateCall.selector,       // custom egress selector
            false                                   // do not ignore ingress selector
        );
    }

    /// @dev Executes a delegate call to the staking contract, if it is set.
    ///      This function always reverts with the return data.
    function revertDelegateCall()
        external
    {
        readOnlyProxyCallee.proxyCall(
            LibProxy.RevertRule.ALWAYS_REVERT,
            bytes4(0),                              // no custom egress selector
            true                                    // ignore ingress selector
        );
    }
}
