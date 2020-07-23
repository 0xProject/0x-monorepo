/*

  Copyright 2020 ZeroEx Intl.

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

pragma solidity ^0.6.5;
pragma experimental ABIEncoderV2;

import "./features/IOwnable.sol";
import "./features/ISimpleFunctionRegistry.sol";
import "./features/ITokenSpender.sol";
import "./features/ISignatureValidator.sol";
import "./features/ITransformERC20.sol";
import "./features/IMetaTransactions.sol";


/// @dev Interface for a fully featured Exchange Proxy.
interface IZeroEx is
    IOwnable,
    ISimpleFunctionRegistry,
    ITokenSpender,
    ISignatureValidator,
    ITransformERC20,
    IMetaTransactions
{
    // solhint-disable state-visibility

    /// @dev Fallback for just receiving ether.
    receive() external payable;

    // solhint-enable state-visibility

    /// @dev Get the implementation contract of a registered function.
    /// @param selector The function selector.
    /// @return impl The implementation contract address.
    function getFunctionImplementation(bytes4 selector)
        external
        view
        returns (address impl);
}
