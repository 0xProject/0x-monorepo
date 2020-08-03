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

import "@0x/contracts-erc20/contracts/src/v06/LibERC20TokenV06.sol";
import "@0x/contracts-erc20/contracts/src/v06/IERC20TokenV06.sol";

interface IEtherToken
{
    function deposit()
        external
        payable;

    function withdraw(uint256 amount)
        external;
}

interface IKyberNetworkProxy {

    /// @dev Sells `sellTokenAddress` tokens for `buyTokenAddress` tokens.
    /// @param sellTokenAddress Token to sell.
    /// @param sellAmount Amount of tokens to sell.
    /// @param buyTokenAddress Token to buy.
    /// @param recipientAddress Address to send bought tokens to.
    /// @param maxBuyTokenAmount A limit on the amount of tokens to buy.
    /// @param minConversionRate The minimal conversion rate. If actual rate
    ///        is lower, trade is canceled.
    /// @param walletId The wallet ID to send part of the fees
    /// @return boughtAmount Amount of tokens bought.
    function trade(
        address sellTokenAddress,
        uint256 sellAmount,
        address buyTokenAddress,
        address payable recipientAddress,
        uint256 maxBuyTokenAmount,
        uint256 minConversionRate,
        address walletId
    )
        external
        payable
        returns(uint256 boughtAmount);
}

contract KyberBridge
{
    using LibERC20TokenV06 for IERC20TokenV06;

    /// @dev Mainnet address of the WETH contract.
    IEtherToken constant private WETH = IEtherToken(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);
    /// @dev Mainnet address of the KyberNetworkProxy contract.
    IKyberNetworkProxy constant private KYBER_NETWORK_PROXY = IKyberNetworkProxy(0x9AAb3f75489902f3a48495025729a0AF77d4b11e);
    /// @dev Kyber ETH pseudo-address.
    address constant public KYBER_ETH_ADDRESS = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    // solhint-disable
    /// @dev Allows this contract to receive ether.
    receive() external payable {}
    // solhint-enable

    function trade(
        address toTokenAddress,
        uint256 sellAmount,
        bytes calldata bridgeData
    )
        external
        returns (uint256 boughtAmount)
    {
        // Decode the bridge data to get the `fromTokenAddress`.
        address fromTokenAddress = abi.decode(bridgeData, (address));
        uint256 payableAmount;

        if (fromTokenAddress != address(WETH)) {
            // If the input token is not WETH, grant an allowance to the exchange
            // to spend them.
            IERC20TokenV06(fromTokenAddress).approveIfBelow(
                address(KYBER_NETWORK_PROXY),
                sellAmount
            );
        } else {
            // If the input token is WETH, unwrap it and attach it to the call.
            fromTokenAddress = KYBER_ETH_ADDRESS;
            payableAmount = sellAmount;
            WETH.withdraw(payableAmount);
        }
        bool isToTokenWeth = toTokenAddress == address(WETH);

        // Try to sell all of this contract's input token balance through
        // `KyberNetworkProxy.trade()`.
        boughtAmount = KYBER_NETWORK_PROXY.trade{ value: payableAmount }(
            // Input token.
            fromTokenAddress,
            // Sell amount.
            sellAmount,
            // Output token.
            isToTokenWeth ? KYBER_ETH_ADDRESS : toTokenAddress,
            // Transfer to this contract
            address(uint160(address(this))),
            // Buy as much as possible.
            uint256(-1),
            // Compute the minimum conversion rate, which is expressed in units with
            // 18 decimal places.
            1,
            // No affiliate address.
            address(0)
        );
        if (isToTokenWeth) {
            WETH.deposit{ value: boughtAmount }();
        }
        return boughtAmount;
    }
}
