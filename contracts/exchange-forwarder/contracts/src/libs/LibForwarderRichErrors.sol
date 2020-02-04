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


library LibForwarderRichErrors {

    // bytes4(keccak256("UnregisteredAssetProxyError()"))
    bytes4 internal constant UNREGISTERED_ASSET_PROXY_ERROR_SELECTOR =
        0xf3b96b8d;

    // bytes4(keccak256("CompleteBuyFailedError(uint256,uint256)"))
    bytes4 internal constant COMPLETE_BUY_FAILED_ERROR_SELECTOR =
        0x91353a0c;

    // bytes4(keccak256("UnsupportedFeeError(bytes)"))
    bytes4 internal constant UNSUPPORTED_FEE_ERROR_SELECTOR =
        0x31360af1;

    // bytes4(keccak256("OverspentWethError(uint256,uint256)"))
    bytes4 internal constant OVERSPENT_WETH_ERROR_SELECTOR =
        0xcdcbed5d;

    // solhint-disable func-name-mixedcase
    function UnregisteredAssetProxyError()
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(UNREGISTERED_ASSET_PROXY_ERROR_SELECTOR);
    }

    function CompleteBuyFailedError(
        uint256 expectedAssetBuyAmount,
        uint256 actualAssetBuyAmount
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            COMPLETE_BUY_FAILED_ERROR_SELECTOR,
            expectedAssetBuyAmount,
            actualAssetBuyAmount
        );
    }

    function UnsupportedFeeError(
        bytes memory takerFeeAssetData
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            UNSUPPORTED_FEE_ERROR_SELECTOR,
            takerFeeAssetData
        );
    }

    function OverspentWethError(
        uint256 wethSpent,
        uint256 msgValue
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            OVERSPENT_WETH_ERROR_SELECTOR,
            wethSpent,
            msgValue
        );
    }
}
