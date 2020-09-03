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

import "@0x/contracts-utils/contracts/src/v06/LibBytesV06.sol";
import "./migrations/LibBootstrap.sol";
import "./features/Bootstrap.sol";
import "./storage/LibProxyStorage.sol";
import "./errors/LibProxyRichErrors.sol";


/// @dev An extensible proxy contract that serves as a universal entry point for
///      interacting with the 0x protocol.
contract ZeroEx {
    // solhint-disable separate-by-one-line-in-contract,indent,var-name-mixedcase
    using LibBytesV06 for bytes;

    // NotImplementedError(bytes4)
    bytes4 constant NOT_IMPLEMENTED_ERROR_SELECTOR = 0x734e6e1c;

    /// @dev Construct this contract and register the `Bootstrap` feature.
    ///      After constructing this contract, `bootstrap()` should be called
    ///      by `bootstrap()` to seed the initial feature set.
    /// @param bootstrapper Who can call `bootstrap()`.
    constructor(address bootstrapper) public {
        // Temporarily create and register the bootstrap feature.
        // It will deregister itself after `bootstrap()` has been called.
        Bootstrap bootstrap = new Bootstrap(bootstrapper);
        LibProxyStorage.getStorage().impls[bootstrap.bootstrap.selector] =
            address(bootstrap);
    }

    // solhint-disable state-visibility

    /// @dev Forwards calls to the appropriate implementation contract.
    fallback() external payable {
        assembly {
            // Copy calldata to memory
            // NOTE: Offset by 28 bytes (which doesn't affect gas cost)
            // so we can use mload(0) to retrieve the bytes4 selector without
            // having to do a shift.
            calldatacopy(28, 0, calldatasize())

            let delegate := sload(mload(0))
            if delegate {
                // Delegate call
                // NOTE: The 2^32 delegatees are stored in the first 2^32 storage slots.
                // TODO: Adjust `LibProxyStorage`
                // NOTE: Empty calldata (receive Ether) is treated as 0x00000000.
                let success := delegatecall(
                    gas(),
                    delegate,
                    28, calldatasize(),
                    0, 0
                )
                returndatacopy(0, 0, returndatasize())
                if success {
                    return(0, returndatasize())
                }
                // Delegate failed. Bubble error.
                revert(0, returndatasize())
            }
            // Invalid function selector. Revert with NotImplementedError.
            mstore(0x20, mload(0))
            mstore(0x00, NOT_IMPLEMENTED_ERROR_SELECTOR)
            revert(0, 0x40)
        }
    }

    /// @dev Fallback for just receiving ether.
    // NOTE: Removed to avoid selector branching. Now maps to bytes4(0).
    // receive() external payable {}

    // solhint-enable state-visibility

    /// @dev Get the implementation contract of a registered function.
    /// @param selector The function selector.
    /// @return impl The implementation contract address.
    // NOTE: Made private to avoid creating a selector branch. If we want this
    // function public we can register it like all the other functions.
    function getFunctionImplementation(bytes4 selector)
        private
        view
        returns (address impl)
    {
        return LibProxyStorage.getStorage().impls[selector];
    }

    /// @dev Revert with arbitrary bytes.
    /// @param data Revert data.
    function _revertWithData(bytes memory data) private pure {
        assembly { revert(add(data, 32), mload(data)) }
    }

    /// @dev Return with arbitrary bytes.
    /// @param data Return data.
    function _returnWithData(bytes memory data) private pure {
        assembly { return(add(data, 32), mload(data)) }
    }
}
