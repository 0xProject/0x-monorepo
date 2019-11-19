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

import "@0x/contracts-erc20/contracts/src/interfaces/IERC20Token.sol";
import "@0x/contracts-erc20/contracts/src/interfaces/IEtherToken.sol";
import "@0x/contracts-erc20/contracts/src/LibERC20Token.sol";
import "@0x/contracts-exchange-libs/contracts/src/IWallet.sol";
import "../interfaces/IERC20Bridge.sol";
import "../interfaces/IKyberNetworkProxy.sol";


// solhint-disable space-after-comma
contract KyberBridge is
    IERC20Bridge,
    IWallet
{
    // @dev Structure used internally to get around stack limits.
    struct TradeState {
        IKyberNetworkProxy kyber;
        IEtherToken weth;
        address fromTokenAddress;
        uint256 fromTokenBalance;
        uint256 payableAmount;
        uint256 minConversionRate;
    }

    /// @dev Address of the WETH contract.
    address constant public WETH_ADDRESS = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    /// @dev Address of the KyberNeworkProxy contract.
    address constant public KYBER_NETWORK_PROXY_ADDRESS = 0x818E6FECD516Ecc3849DAf6845e3EC868087B755;
    /// @dev Kyber ETH pseudo-address.
    address constant public KYBER_ETH_ADDRESS = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    /// @dev Callback for `IKyberBridge`. Tries to buy `amount` of
    ///      `toTokenAddress` tokens by selling the entirety of the opposing asset
    ///      to the `KyberNetworkProxy` contract, then transfers the bought
    ///      tokens to `to`.
    /// @param toTokenAddress The token to give to `to`.
    /// @param to The recipient of the bought tokens.
    /// @param amount Minimum amount of `toTokenAddress` tokens to buy.
    /// @param bridgeData The abi-encoeded "from" token address.
    /// @return success The magic bytes if successful.
    function bridgeTransferFrom(
        address toTokenAddress,
        address /* from */,
        address to,
        uint256 amount,
        bytes calldata bridgeData
    )
        external
        returns (bytes4 success)
    {
        TradeState memory state;
        state.kyber = _getKyberContract();
        state.weth = _getWETHContract();
        // Decode the bridge data to get the `fromTokenAddress`.
        (state.fromTokenAddress) = abi.decode(bridgeData, (address));
        state.fromTokenBalance = IERC20Token(state.fromTokenAddress).balanceOf(address(this));
        if (state.fromTokenBalance == 0) {
            // Do nothing if no input tokens.
            return BRIDGE_SUCCESS;
        }
        state.minConversionRate = (10 ** 18) * amount / state.fromTokenBalance;
        if (state.fromTokenAddress == toTokenAddress) {
            // Just transfer the tokens if they're the same.
            LibERC20Token.transfer(state.fromTokenAddress, to, state.fromTokenBalance);
            return BRIDGE_SUCCESS;
        } else if (state.fromTokenAddress != address(state.weth)) {
            // If the input token is not WETH, grant an allowance to the exchange
            // to spend them.
            LibERC20Token.approve(state.fromTokenAddress, address(state.kyber), uint256(-1));
        } else {
            // If the input token is WETH, unwrap it and attach it to the call.
            state.fromTokenAddress = KYBER_ETH_ADDRESS;
            state.payableAmount = state.fromTokenBalance;
            state.weth.withdraw(state.fromTokenBalance);
        }

        // Try to sell all of this contract's input token balance.
        uint256 boughtAmount = state.kyber.trade.value(state.payableAmount)(
            // Input token.
            state.fromTokenAddress,
            // Sell amount.
            state.fromTokenBalance,
            // Output token.
            toTokenAddress == address(state.weth) ?
                KYBER_ETH_ADDRESS :
                toTokenAddress,
            // Transfer to this contract if converting to ETH, otherwise
            // transfer directly to the recipient.
            toTokenAddress == address(state.weth) ?
                address(uint160(address(this))) :
                address(uint160(to)),
            // Buy as much as possible.
            uint256(-1),
            // Minimum conversion rate.
            state.minConversionRate,
            // No affiliate address.
            address(0)
        );
        // Wrap ETH output and transfer to recipient.
        if (toTokenAddress == address(state.weth)) {
            state.weth.deposit.value(boughtAmount)();
            state.weth.transfer(to, boughtAmount);
        }
        return BRIDGE_SUCCESS;
    }

    /// @dev `SignatureType.Wallet` callback, so that this bridge can be the maker
    ///      and sign for itself in orders. Always succeeds.
    /// @return magicValue Magic success bytes, always.
    function isValidSignature(
        bytes32,
        bytes calldata
    )
        external
        view
        returns (bytes4 magicValue)
    {
        return LEGACY_WALLET_MAGIC_VALUE;
    }

    /// @dev Overridable way to get the `KyberNetworkProxy` contract.
    /// @return kyber The `IKyberNetworkProxy` contract.
    function _getKyberContract()
        internal
        view
        returns (IKyberNetworkProxy kyber)
    {
        return IKyberNetworkProxy(KYBER_NETWORK_PROXY_ADDRESS);
    }

    /// @dev Overridable way to get the WETH contract.
    /// @return weth The WETH contract.
    function _getWETHContract()
        internal
        view
        returns (IEtherToken weth)
    {
        return IEtherToken(WETH_ADDRESS);
    }
}
