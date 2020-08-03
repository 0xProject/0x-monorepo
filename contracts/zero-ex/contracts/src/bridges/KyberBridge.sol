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

    // @dev Structure used internally to get around stack limits.
    struct TradeState {
        IKyberNetworkProxy kyber;
        IEtherToken weth;
        address fromTokenAddress;
        uint256 fromTokenBalance;
        uint256 payableAmount;
        uint256 conversionRate;
    }

    /// @dev Mainnet address of the WETH contract.
    address constant private WETH_ADDRESS = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    /// @dev Mainnet address of the KyberNetworkProxy contract.
    address constant private KYBER_NETWORK_PROXY_ADDRESS = 0x9AAb3f75489902f3a48495025729a0AF77d4b11e;
    /// @dev Kyber ETH pseudo-address.
    address constant public KYBER_ETH_ADDRESS = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    /// @dev `bridgeTransferFrom()` failure result.
    bytes4 constant private BRIDGE_FAILED = 0x0;
    /// @dev Precision of Kyber rates.
    uint256 constant private KYBER_RATE_BASE = 10 ** 18;

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
        TradeState memory state;
        state.kyber = IKyberNetworkProxy(0x9AAb3f75489902f3a48495025729a0AF77d4b11e);
        state.weth = IEtherToken(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);
        // Decode the bridge data to get the `fromTokenAddress`.
        (state.fromTokenAddress) = abi.decode(bridgeData, (address));
        state.fromTokenBalance = sellAmount;

        if (state.fromTokenAddress != address(state.weth)) {
            // If the input token is not WETH, grant an allowance to the exchange
            // to spend them.
            IERC20TokenV06(state.fromTokenAddress).approveIfBelow(
                address(state.kyber),
                state.fromTokenBalance
            );
        } else {
            // If the input token is WETH, unwrap it and attach it to the call.
            state.fromTokenAddress = KYBER_ETH_ADDRESS;
            state.payableAmount = state.fromTokenBalance;
            state.weth.withdraw(state.payableAmount);
        }
        bool isToTokenWeth = toTokenAddress == address(state.weth);

        // Try to sell all of this contract's input token balance through
        // `KyberNetworkProxy.trade()`.
        uint256 boughtAmount = state.kyber.trade{ value: state.payableAmount }(
            // Input token.
            state.fromTokenAddress,
            // Sell amount.
            state.fromTokenBalance,
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
            state.weth.deposit.value(boughtAmount)();
        }
        return boughtAmount;
    }
}
