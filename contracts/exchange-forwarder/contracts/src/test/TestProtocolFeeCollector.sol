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

import "@0x/contracts-asset-proxy/contracts/src/interfaces/IAssetData.sol";
import "@0x/contracts-asset-proxy/contracts/src/interfaces/IAssetProxy.sol";
import "@0x/contracts-erc20/contracts/src/interfaces/IERC20Token.sol";


 // solhint-disable no-unused-vars
contract TestProtocolFeeCollector {

    address private _wethAddress;
    address private _wethAssetProxyAddress;

    constructor (
        address wethAddress,
        address wethAssetProxyAddress
    )
        public
    {
        _wethAddress = wethAddress;
        _wethAssetProxyAddress = wethAssetProxyAddress;
    }

    /// @dev Pays a protocol fee in WETH (Forwarder orders will always pay protocol fees in WETH).
    /// @param makerAddress The address of the order's maker.
    /// @param payerAddress The address of the protocol fee payer.
    /// @param protocolFeePaid The protocol fee that should be paid.
    function payProtocolFee(
        address makerAddress,
        address payerAddress,
        uint256 protocolFeePaid
    )
        external
        payable
    {
        assert(msg.value == 0);

        IAssetProxy wethAssetProxy = IAssetProxy(_wethAssetProxyAddress);
        bytes memory wethAssetData = abi.encodeWithSelector(
            IAssetData(address(0)).ERC20Token.selector,
            _wethAddress
        );
        // Transfer the protocol fee to this address in WETH.
        wethAssetProxy.transferFrom(
            wethAssetData,
            payerAddress,
            address(this),
            protocolFeePaid
        );
    }
}
