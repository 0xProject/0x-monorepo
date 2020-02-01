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
  limitations \under the License.

*/

pragma solidity ^0.5.9;

import "@0x/contracts-asset-proxy/contracts/src/interfaces/IAssetData.sol";
import "@0x/contracts-erc20/contracts/src/interfaces/IEtherToken.sol";
import "@0x/contracts-exchange/contracts/src/interfaces/IExchange.sol";
import "@0x/contracts-utils/contracts/src/LibRichErrors.sol";
import "@0x/contracts-utils/contracts/src/LibSafeMath.sol";
import "./rich-errors/LibWethUtilsRichErrors.sol";


contract MixinWethUtils {

    uint256 constant internal MAX_UINT256 = uint256(-1);

     // solhint-disable var-name-mixedcase
    IEtherToken internal WETH;
    bytes internal WETH_ASSET_DATA;
    // solhint-enable var-name-mixedcase

    using LibSafeMath for uint256;

    constructor (
        address exchange,
        address weth
    )
        public
    {
        WETH = IEtherToken(weth);
        WETH_ASSET_DATA = abi.encodeWithSelector(
            IAssetData(address(0)).ERC20Token.selector,
            weth
        );

        address proxyAddress = IExchange(exchange).getAssetProxy(IAssetData(address(0)).ERC20Token.selector);
        if (proxyAddress == address(0)) {
            LibRichErrors.rrevert(LibWethUtilsRichErrors.UnregisteredAssetProxyError());
        }
        WETH.approve(proxyAddress, MAX_UINT256);

        address protocolFeeCollector = IExchange(exchange).protocolFeeCollector();
        if (protocolFeeCollector != address(0)) {
            WETH.approve(protocolFeeCollector, MAX_UINT256);
        }
    }

    /// @dev Default payable function, this allows us to withdraw WETH
    function ()
        external
        payable
    {
        if (msg.sender != address(WETH)) {
            LibRichErrors.rrevert(LibWethUtilsRichErrors.DefaultFunctionWethContractOnlyError(
                msg.sender
            ));
        }
    }

    /// @dev Transfers ETH denominated fees to all feeRecipient addresses
    /// @param ethFeeAmounts Amounts of ETH, denominated in Wei, that are paid to corresponding feeRecipients.
    /// @param feeRecipients Addresses that will receive ETH when orders are filled.
    /// @return ethRemaining msg.value minus the amount of ETH spent on affiliate fees.
    function _transferEthFeesAndWrapRemaining(
        uint256[] memory ethFeeAmounts,
        address payable[] memory feeRecipients
    )
        internal
        returns (uint256 ethRemaining)
    {
        uint256 feesLen = ethFeeAmounts.length;
        // ethFeeAmounts len must equal feeRecipients len
        if (feesLen != feeRecipients.length) {
            LibRichErrors.rrevert(LibWethUtilsRichErrors.EthFeeLengthMismatchError(
                feesLen,
                feeRecipients.length
            ));
        }

        // This function is always called before any other function, so we assume that
        // the ETH remaining is the entire msg.value.
        ethRemaining = msg.value;

        for (uint256 i = 0; i != feesLen; i++) {
            uint256 ethFeeAmount = ethFeeAmounts[i];
            // Ensure there is enough ETH to pay the fee
            if (ethRemaining < ethFeeAmount) {
                LibRichErrors.rrevert(LibWethUtilsRichErrors.InsufficientEthForFeeError(
                    ethFeeAmount,
                    ethRemaining
                ));
            }
            // Decrease ethRemaining and transfer fee to corresponding feeRecipient
            ethRemaining = ethRemaining.safeSub(ethFeeAmount);
            feeRecipients[i].transfer(ethFeeAmount);
        }

        // Convert remaining ETH to WETH.
        WETH.deposit.value(ethRemaining)();

        return ethRemaining;
    }

    /// @dev Unwraps and refunds WETH to msg.sender.
    /// @param refundAmount Amount of WETH balance to refund.
    function _transferEthRefund(
        uint256 refundAmount
    )
        internal
    {
        // Do nothing if no WETH to refund
        if (refundAmount > 0) {
            // Convert WETH to ETH
            WETH.withdraw(refundAmount);
            // Transfer ETH to sender
            msg.sender.transfer(refundAmount);
        }
    }
}
