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

import "@0x/contracts-erc20/contracts/src/v06/IERC20TokenV06.sol";
import "@0x/contracts-erc20/contracts/src/v06/LibERC20TokenV06.sol";
import "@0x/contracts-utils/contracts/src/v06/errors/LibRichErrorsV06.sol";
import "@0x/contracts-utils/contracts/src/v06/LibSafeMathV06.sol";
import "../errors/LibTransformERC20RichErrors.sol";
import "../fixins/FixinCommon.sol";
import "../migrations/LibMigrate.sol";
import "../puppets/IPuppet.sol";
import "../transformers/IERC20Transformer.sol";
import "../transformers/LibERC20Transformer.sol";
import "./ITransformERC20.sol";
import "./ITokenSpender.sol";
import "./IFeature.sol";
import "./IPuppetPool.sol";
import "./ISimpleFunctionRegistry.sol";


/// @dev Feature to composably transform between ERC20 tokens.
contract TransformERC20 is
    IFeature,
    ITransformERC20,
    FixinCommon
{
    // solhint-disable const-name-snakecase
    /// @dev Name of this feature.
    string constant public override FEATURE_NAME = "TransformERC20";
    /// @dev Version of this feature.
    uint256 constant public override FEATURE_VERSION = (1 << 64) | (0 << 32) | (0);
    // solhint-enable const-name-snakecase

    /// @dev The implementation address of this feature.
    address private immutable _impl;

    using LibSafeMathV06 for uint256;
    using LibRichErrorsV06 for bytes;

    constructor() public {
        _impl = address(this);
    }

    /// @dev Initialize and register this feature.
    ///      Should be delegatecalled by `Migrate.migrate()`.
    function migrate() external returns (bytes4 success) {
        ISimpleFunctionRegistry(address(this))
            .extend(this.transformERC20.selector, _impl);
        ISimpleFunctionRegistry(address(this))
            .extend(this._transformERC20.selector, _impl);
        return LibMigrate.MIGRATE_SUCCESS;
    }

    /// @dev Executes a series of transformations to convert an ERC20 `inputToken`
    ///      to an ERC20 `outputToken`.
    /// @param inputToken The token being provided by the sender.
    ///        If `0xeee...`, ETH is implied and should be provided with the call.`
    /// @param outputToken The token to be acquired by the sender.
    ///        `0xeee...` implies ETH.
    /// @param inputTokenAmount The amount of `inputToken` to take from the sender.
    /// @param minOutputTokenAmount The minimum amount of `outputToken` the sender
    ///        must receive for the entire transformation to succeed.
    /// @return outputTokenAmount The amount of `outputToken` received by the sender.
    function transformERC20(
        IERC20TokenV06 inputToken,
        IERC20TokenV06 outputToken,
        uint256 inputTokenAmount,
        uint256 minOutputTokenAmount,
        Transformation[] memory transformations
    )
        public
        override
        payable
        returns (uint256 outputTokenAmount)
    {
        return _transformERC20(
            keccak256(msg.data),
            msg.sender,
            inputToken,
            outputToken,
            inputTokenAmount,
            minOutputTokenAmount,
            transformations
        );
    }

    /// @dev Internal version of `transformERC20()`. Only callable from within.
    /// @param callDataHash Hash of the ingress calldata.
    /// @param taker The taker address.
    /// @param inputToken The token being provided by the sender.
    ///        If `0xeee...`, ETH is implied and should be provided with the call.`
    /// @param outputToken The token to be acquired by the sender.
    ///        `0xeee...` implies ETH.
    /// @param inputTokenAmount The amount of `inputToken` to take from the sender.
    /// @param minOutputTokenAmount The minimum amount of `outputToken` the sender
    ///        must receive for the entire transformation to succeed.
    /// @return outputTokenAmount The amount of `outputToken` received by the sender.
    function _transformERC20(
        bytes32 callDataHash,
        address payable taker,
        IERC20TokenV06 inputToken,
        IERC20TokenV06 outputToken,
        uint256 inputTokenAmount,
        uint256 minOutputTokenAmount,
        Transformation[] memory transformations
    )
        public
        override
        payable
        onlySelf
        returns (uint256 outputTokenAmount)
    {
        // If the input token amount is -1, transform the taker's entire
        // spendable balance.
        if (inputTokenAmount == uint256(-1)) {
            inputTokenAmount = ITokenSpender(address(this))
                .getSpendableERC20BalanceOf(inputToken, taker);
        }

        // Acquire a puppet to hold balances and execute transformers.
        IPuppet puppet = IPuppetPool(address(this))._acquirePuppet();

        // Remember the initial output token balance of the sender.
        uint256 senderOutputTokenBalanceBefore = minOutputTokenAmount == 0
            ? 0 : LibERC20Transformer.getTokenBalanceOf(outputToken, taker);

        // Pull input tokens from the taker to the puppet and transfer attached ETH.
        _transferInputTokensAndAttachedEth(inputToken, taker, address(puppet), inputTokenAmount);

        // Perform transformations.
        for (uint256 i = 0; i < transformations.length; ++i) {
            _executeTransformation(puppet, transformations[i], taker, callDataHash);
        }

        // Ensure enough output token has been sent to the sender.
        if (minOutputTokenAmount != 0) {
            // Compute how much output token has been transferred to the sender.
            uint256 senderOutputTokenBalanceAfter =
                LibERC20Transformer.getTokenBalanceOf(outputToken, taker);
            if (senderOutputTokenBalanceAfter > senderOutputTokenBalanceBefore) {
                outputTokenAmount = senderOutputTokenBalanceAfter.safeSub(
                    senderOutputTokenBalanceBefore
                );
            }
            if (outputTokenAmount < minOutputTokenAmount) {
                LibTransformERC20RichErrors.IncompleteERC20TransformError(
                    address(outputToken),
                    outputTokenAmount,
                    minOutputTokenAmount
                ).rrevert();
            }
        }

        // Release the puppet.
        IPuppetPool(address(this))._releasePuppet(puppet);

        // Emit an event.
        emit TransformedERC20(
            taker,
            address(inputToken),
            address(outputToken),
            inputTokenAmount,
            outputTokenAmount
        );
    }

    /// @dev Transfer input tokens from the caller and any attached ETH to `to`
    function _transferInputTokensAndAttachedEth(
        IERC20TokenV06 inputToken,
        address taker,
        address payable to,
        uint256 amount
    )
        private
    {
        // Transfer any attached ETH.
        if (msg.value != 0) {
            to.transfer(msg.value);
        }
        // Transfer input token.
        if (!LibERC20Transformer.isTokenETH(inputToken)) {
            // Token is not ETH, so pull the ERC20 from the taker.
            ITokenSpender(address(this))._spendERC20Tokens(
                inputToken,
                taker,
                to,
                amount
            );
        } else {
            // Token is ETH, so the caller must attach enough ETH to the call.
            if (msg.value < amount) {
                LibTransformERC20RichErrors.InsufficientEthAttachedError(
                    msg.value,
                    amount
                ).rrevert();
            }
        }
    }

    /// @dev Transfers tokens to a transformer then executes it.
    function _executeTransformation(
        IPuppet puppet,
        Transformation memory transformation,
        address payable taker,
        bytes32 callDataHash
    )
        private
    {
        // Tokens and amounts must be the same length.
        if (transformation.tokens.length != transformation.amounts.length) {
            LibTransformERC20RichErrors
                .InvalidTransformationError(
                    address(transformation.transformer),
                    _asAddressArray(transformation.tokens),
                    transformation.amounts,
                    transformation.data
                ).rrevert();
        }
        // Calculate the amount of each token to send to the transformer.
        uint256[] memory tokenAmounts = new uint256[](transformation.tokens.length);
        uint256 totalETHToAttach = 0;
        for (uint256 i = 0; i < tokenAmounts.length; ++i) {
            tokenAmounts[i] = transformation.amounts[i] != uint256(-1)
                ? transformation.amounts[i]
                : LibERC20Transformer.getTokenBalanceOf(
                    transformation.tokens[i],
                    address(puppet)
                );
            // If the token is not ETH, transfer tokens to the
            // transformer before calling it.
            if (!LibERC20Transformer.isTokenETH(transformation.tokens[i])) {
                _puppetTransferERC20Token(
                    puppet,
                    transformation.tokens[i],
                    address(transformation.transformer),
                    tokenAmounts[i]
                );
            } else {
                totalETHToAttach = totalETHToAttach.safeAdd(tokenAmounts[i]);
            }
        }
        // Call the transformer.
        _puppetCallTransformer(
            puppet,
            transformation,
            tokenAmounts,
            totalETHToAttach,
            taker,
            callDataHash
        );
    }

    /// @dev Transfers ERC20 tokens (not ETH) from the puppet to an address.
    function _puppetTransferERC20Token(
        IPuppet puppet,
        IERC20TokenV06 token,
        address to,
        uint256 amount
    )
        private
    {
        bool success = LibERC20TokenV06.isSuccessfulResult(
            puppet.execute(
                address(uint160(address(token))),
                abi.encodeWithSelector(
                    IERC20TokenV06.transfer.selector,
                    to,
                    amount
                ),
                0
            )
        );
        if (!success) {
            LibTransformERC20RichErrors.TransferERC20FailedError(
                address(token),
                to,
                amount
            ).rrevert();
        }
    }

    /// @dev Calls a transformer through the puppet.
    function _puppetCallTransformer(
        IPuppet puppet,
        Transformation memory transformation,
        uint256[] memory tokenAmounts,
        uint256 ethToAttach,
        address payable taker,
        bytes32 callDataHash
    )
        private
    {
        // Call `transformer.transform()` through the puppet.
        bytes memory resultData = puppet.execute(
            // Call target.
            address(uint160(address(transformation.transformer))),
            // Call data.
            abi.encodeWithSelector(
                IERC20Transformer.transform.selector,
                callDataHash,
                taker,
                transformation.tokens,
                tokenAmounts,
                transformation.data
            ),
            // msg.value
            ethToAttach
        );
        // Ensure the transformer returned the magic bytes.
        if (abi.decode(resultData, (bytes4)) != LibERC20Transformer.TRANSFORMER_SUCCESS) {
            LibTransformERC20RichErrors.ERC20TransformerFailedError(
                address(transformation.transformer),
                _asAddressArray(transformation.tokens),
                tokenAmounts
            ).rrevert();
        }
    }

    /// @dev Cast an array of tokens to an array of addresses.
    function _asAddressArray(IERC20TokenV06[] memory tokens)
        private
        pure
        returns (address[] memory addrs)
    {
        assembly { addrs := tokens }
    }
}
