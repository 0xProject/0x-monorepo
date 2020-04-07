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
import "./interfaces/IZeroExBootstrapper.sol";
import "./storage/LibProxyStorage.sol";
import "./errors/LibProxyRichErrors.sol";


/// @dev An extensible proxy contract that serves as a universal entry point for
///      interacting with the 0x protocol.
contract ZeroEx {

    // solhint-disable separate-by-one-line-in-contract,indent,var-name-mixedcase

    using LibBytesV06 for bytes;

    /// @dev Construct this contract.
    ///      After constructing this contract, the deployer should call
    ///      `bootstrap()` to seed the initial feature set.
    constructor() public {
        // Set the `bootstrap()` caller to the deployer.
        LibProxyStorage.getStorage().bootstrapCaller = msg.sender;
    }

    // solhint-disable state-visibility

    /// @dev Forwards calls to the appropriate implementation contract.
    fallback() external payable {
        bytes4 selector = msg.data.readBytes4(0);
        address impl = getFunctionImplementation(selector);
        if (impl == address(0)) {
            _revertWithData(LibProxyRichErrors.NotImplementedError(selector));
        }

        (bool success, bytes memory resultData) = impl.delegatecall(msg.data);
        if (!success) {
            _revertWithData(resultData);
        }
        _returnWithData(resultData);
    }

    /// @dev Fallback for just receiving ether.
    receive() external payable {}

    // solhint-enable state-visibility

    /// @dev Bootstrap the initial feature set of this contract.
    ///      This can only be called once by the deployer of this contract.
    /// @param bootstrappers Array of bootstrapping contracts to delegatecall into.
    function bootstrap(IZeroExBootstrapper[] calldata bootstrappers) external {
        LibProxyStorage.Storage storage stor = LibProxyStorage.getStorage();

        // If `bootstrapCaller` is zero, the contract has already been bootstrapped.
        address bootstrapCaller = stor.bootstrapCaller;
        if (bootstrapCaller == address(0)) {
            _revertWithData(LibProxyRichErrors.AlreadyBootstrappedError());
        }
        // Only the deployer caller can call this function.
        if (bootstrapCaller != msg.sender) {
            _revertWithData(
                LibProxyRichErrors.InvalidBootstrapCallerError(msg.sender, bootstrapCaller)
            );
        }
        // Prevent calling `bootstrap()` again.
        stor.bootstrapCaller = address(0);

        // Call the bootstrap contracts.
        for (uint256 i = 0; i < bootstrappers.length; ++i) {
            // Delegatecall into the bootstrap contract.
            (bool success, bytes memory resultData) = address(bootstrappers[i])
                .delegatecall(abi.encodeWithSelector(
                    IZeroExBootstrapper.bootstrap.selector,
                    address(bootstrappers[i])
                ));
            if (!success) {
                _revertWithData(resultData);
            }
        }
    }

    /// @dev Get the implementation contract of a registered function.
    /// @param selector The function selector.
    /// @return impl The implementation contract address.
    function getFunctionImplementation(bytes4 selector)
        public
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
