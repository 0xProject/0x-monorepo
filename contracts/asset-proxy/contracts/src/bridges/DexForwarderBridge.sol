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

pragma solidity ^0.5.9;
pragma experimental ABIEncoderV2;

import "@0x/contracts-erc20/contracts/src/interfaces/IERC20Token.sol";
import "@0x/contracts-erc20/contracts/src/LibERC20Token.sol";
import "@0x/contracts-exchange-libs/contracts/src/IWallet.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibMath.sol";
import "@0x/contracts-utils/contracts/src/DeploymentConstants.sol";
import "@0x/contracts-utils/contracts/src/LibBytes.sol";
import "@0x/contracts-utils/contracts/src/LibSafeMath.sol";
import "../interfaces/IERC20Bridge.sol";
import "./MixinGasToken.sol";


// solhint-disable space-after-comma, indent
contract DexForwarderBridge is
    IERC20Bridge,
    IWallet,
    DeploymentConstants,
    MixinGasToken
{
    using LibSafeMath for uint256;

    /// @dev Data needed to reconstruct a bridge call.
    struct BridgeCall {
        address target;
        uint256 inputTokenAmount;
        uint256 outputTokenAmount;
        bytes bridgeData;
    }

    /// @dev Intermediate state variables used by `bridgeTransferFrom()`, in
    ///      struct form to get around stack limits.
    struct TransferFromState {
        address inputToken;
        uint256 initialInputTokenBalance;
        uint256 callInputTokenAmount;
        uint256 callOutputTokenAmount;
        uint256 totalInputTokenSold;
        BridgeCall[] calls;
    }

    /// @dev Spends this contract's entire balance of input tokens by forwarding
    /// them to other bridges. Reverts if the entire balance is not spent.
    /// @param outputToken The token being bought.
    /// @param to The recipient of the bought tokens.
    /// @param bridgeData The abi-encoded input token address.
    /// @return success The magic bytes if successful.
    function bridgeTransferFrom(
        address outputToken,
        address /* from */,
        address to,
        uint256 /* amount */,
        bytes calldata bridgeData
    )
        external
        freesGasTokensFromCollector
        returns (bytes4 success)
    {
        require(
            msg.sender == _getERC20BridgeProxyAddress(),
            "DexForwarderBridge/SENDER_NOT_AUTHORIZED"
        );
        TransferFromState memory state;
        (
            state.inputToken,
            state.calls
        ) = abi.decode(bridgeData, (address, BridgeCall[]));

        state.initialInputTokenBalance =
            IERC20Token(state.inputToken).balanceOf(address(this));

        for (uint256 i = 0; i < state.calls.length; ++i) {
            // Stop if the we've sold all our input tokens.
            if (state.totalInputTokenSold >= state.initialInputTokenBalance) {
                break;
            }

            // Compute token amounts.
            state.callInputTokenAmount = LibSafeMath.min256(
                state.calls[i].inputTokenAmount,
                state.initialInputTokenBalance.safeSub(state.totalInputTokenSold)
            );
            state.callOutputTokenAmount = LibMath.getPartialAmountFloor(
                state.callInputTokenAmount,
                state.calls[i].inputTokenAmount,
                state.calls[i].outputTokenAmount
            );

            // Execute the call in a new context so we can recoup transferred
            // funds by reverting.
            (bool didSucceed, ) = address(this)
                .call(abi.encodeWithSelector(
                    this.executeBridgeCall.selector,
                    state.calls[i].target,
                    to,
                    state.inputToken,
                    outputToken,
                    state.callInputTokenAmount,
                    state.callOutputTokenAmount,
                    state.calls[i].bridgeData
                ));

            if (didSucceed) {
                // Increase the amount of tokens sold.
                state.totalInputTokenSold = state.totalInputTokenSold.safeAdd(
                    state.callInputTokenAmount
                );
            }
        }
        // Always succeed.
        return BRIDGE_SUCCESS;
    }

    /// @dev Transfers `inputToken` token to a bridge contract then calls
    ///      its `bridgeTransferFrom()`. This is executed in separate context
    ///      so we can revert the transfer on error. This can only be called
    //       by this contract itself.
    /// @param bridge The bridge contract.
    /// @param to The recipient of `outputToken` tokens.
    /// @param inputToken The input token.
    /// @param outputToken The output token.
    /// @param inputTokenAmount The amount of input tokens to transfer to `bridge`.
    /// @param outputTokenAmount The amount of expected output tokens to be sent
    ///        to `to` by `bridge`.
    function executeBridgeCall(
        address bridge,
        address to,
        address inputToken,
        address outputToken,
        uint256 inputTokenAmount,
        uint256 outputTokenAmount,
        bytes calldata bridgeData
    )
        external
    {
        // Must be called through `bridgeTransferFrom()`.
        require(msg.sender == address(this), "DexForwarderBridge/ONLY_SELF");
        // `bridge` must not be this contract.
        require(bridge != address(this));

        // Get the starting balance of output tokens for `to`.
        uint256 initialRecipientBalance = IERC20Token(outputToken).balanceOf(to);

        // Transfer input tokens to the bridge.
        LibERC20Token.transfer(inputToken, bridge, inputTokenAmount);

        // Call the bridge.
        (bool didSucceed, bytes memory resultData) =
            bridge.call(abi.encodeWithSelector(
                IERC20Bridge(0).bridgeTransferFrom.selector,
                outputToken,
                bridge,
                to,
                outputTokenAmount,
                bridgeData
            ));

        // Revert if the call failed or not enough tokens were bought.
        // This will also undo the token transfer.
        require(
            didSucceed
            && resultData.length == 32
            && LibBytes.readBytes32(resultData, 0) == bytes32(BRIDGE_SUCCESS)
            && IERC20Token(outputToken).balanceOf(to).safeSub(initialRecipientBalance) >= outputTokenAmount
        );
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
}
