/*

  Copyright 2018 ZeroEx Intl.

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

pragma solidity ^0.4.24;
pragma experimental ABIEncoderV2;

import "./MixinWethFees.sol";
import "./MixinMarketSellTokens.sol";
import "./MixinMarketBuyTokens.sol";
import "./MixinConstants.sol";
import "../utils/Ownable/Ownable.sol";

contract Forwarder is
    Ownable,
    MixinConstants,
    MixinWethFees,
    MixinMarketBuyZrx,
    MixinMarketBuyTokens,
    MixinMarketSellTokens
{
    uint256 MAX_UINT = 2**256 - 1;

    constructor (
        address _exchange,
        address _etherToken,
        address _zrxToken,
        bytes4 _erc20AssetProxyId,
        bytes memory _zrxAssetData,
        bytes memory _wethAssetData
    )
        public
        Ownable()
        MixinConstants(
            _exchange,
            _etherToken,
            _zrxToken,
            _zrxAssetData,
            _wethAssetData
        )
    {
        setERC20ProxyApproval(_erc20AssetProxyId);
    }

    /// @dev Default payabale function, this allows us to withdraw WETH
    function ()
        public
        payable
    {
        require(
            msg.sender == address(ETHER_TOKEN),
            "DEFAULT_FUNCTION_WETH_CONTRACT_ONLY"
        );
    }

    /// @dev Sets the allowances to the proxy for this contract
    function setERC20ProxyApproval(bytes4 erc20AssetProxyId)
        public
        onlyOwner
    {
        address proxyAddress = EXCHANGE.getAssetProxy(erc20AssetProxyId);
        if (proxyAddress != address(0)) {
            ETHER_TOKEN.approve(proxyAddress, MAX_UINT);
            ZRX_TOKEN.approve(proxyAddress, MAX_UINT);
        }
    }
}
