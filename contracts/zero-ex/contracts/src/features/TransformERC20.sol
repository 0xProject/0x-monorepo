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
import "../external/IFlashWallet.sol";
import "../external/FlashWallet.sol";
import "../storage/LibTransformERC20Storage.sol";
import "../transformers/IERC20Transformer.sol";
import "../transformers/LibERC20Transformer.sol";
import "./ITransformERC20.sol";
import "./ITokenSpender.sol";
import "./IFeature.sol";
import "./ISimpleFunctionRegistry.sol";


/// @dev Feature to composably transform between ERC20 tokens.
contract TransformERC20 is
    IFeature,
    ITransformERC20,
    FixinCommon
{

    // solhint-disable
    /// @dev Name of this feature.
    string public constant override FEATURE_NAME = "TransformERC20";
    /// @dev Version of this feature.
    uint256 public immutable override FEATURE_VERSION = _encodeVersion(1, 0, 0);
    /// @dev The trusted deployer for all transformers.
    address public immutable transformDeployer;
    /// @dev The implementation address of this feature.
    address private immutable _implementation;
    // solhint-enable

    using LibSafeMathV06 for uint256;
    using LibRichErrorsV06 for bytes;

    constructor(address trustedDeployer_) public {
        _implementation = address(this);
        transformDeployer = trustedDeployer_;
    }

    /// @dev Initialize and register this feature.
    ///      Should be delegatecalled by `Migrate.migrate()`.
    function migrate() external returns (bytes4 success) {
        ISimpleFunctionRegistry(address(this))
            .extend(this.getTransformerDeployer.selector, _implementation);
        ISimpleFunctionRegistry(address(this))
            .extend(this.createTransformWallet.selector, _implementation);
        ISimpleFunctionRegistry(address(this))
            .extend(this.getTransformWallet.selector, _implementation);
        ISimpleFunctionRegistry(address(this))
            .extend(this.transformERC20.selector, _implementation);
        ISimpleFunctionRegistry(address(this))
            .extend(this._transformERC20.selector, _implementation);
        createTransformWallet();
        return LibMigrate.MIGRATE_SUCCESS;
    }

    /// @dev Return the allowed deployer for transformers.
    /// @return deployer The transform deployer address.
    function getTransformerDeployer()
        external
        override
        view
        returns (address deployer)
    {
        return transformDeployer;
    }

    /// @dev Deploy a new wallet instance and replace the current one with it.
    ///      Useful if we somehow break the current wallet instance.
    ///      Anyone can call this.
    /// @return wallet The new wallet instance.
    function createTransformWallet()
        public
        override
        returns (IFlashWallet wallet)
    {
        wallet = new FlashWallet();
        LibTransformERC20Storage.getStorage().wallet = wallet;
    }

    /// @dev Executes a series of transformations to convert an ERC20 `inputToken`
    ///      to an ERC20 `outputToken`.
    /// @param inputToken The token being provided by the sender.
    ///        If `0xeee...`, ETH is implied and should be provided with the call.`
    /// @param outputToken The token to be acquired by the sender.
    ///        `0xeee...` implies ETH.
    /// @param inputTokenAmount The amount of `inputToken` to take from the sender.
    ///        If set to `uint256(-1)`, the entire spendable balance of the taker
    ///        will be solt.
    /// @param minOutputTokenAmount The minimum amount of `outputToken` the sender
    ///        must receive for the entire transformation to succeed. If set to zero,
    ///        the minimum output token transfer will not be asserted.
    /// @param transformations The transformations to execute on the token balance(s)
    ///        in sequence.
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
        return _transformERC20Private(
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
    /// @param inputToken The token being provided by the taker.
    ///        If `0xeee...`, ETH is implied and should be provided with the call.`
    /// @param outputToken The token to be acquired by the taker.
    ///        `0xeee...` implies ETH.
    /// @param inputTokenAmount The amount of `inputToken` to take from the taker.
    ///        If set to `uint256(-1)`, the entire spendable balance of the taker
    ///        will be solt.
    /// @param minOutputTokenAmount The minimum amount of `outputToken` the taker
    ///        must receive for the entire transformation to succeed. If set to zero,
    ///        the minimum output token transfer will not be asserted.
    /// @param transformations The transformations to execute on the token balance(s)
    ///        in sequence.
    /// @return outputTokenAmount The amount of `outputToken` received by the taker.
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
        return _transformERC20Private(
            callDataHash,
            taker,
            inputToken,
            outputToken,
            inputTokenAmount,
            minOutputTokenAmount,
            transformations
        );
    }

    /// @dev Private version of `transformERC20()`.
    /// @param callDataHash Hash of the ingress calldata.
    /// @param taker The taker address.
    /// @param inputToken The token being provided by the taker.
    ///        If `0xeee...`, ETH is implied and should be provided with the call.`
    /// @param outputToken The token to be acquired by the taker.
    ///        `0xeee...` implies ETH.
    /// @param inputTokenAmount The amount of `inputToken` to take from the taker.
    ///        If set to `uint256(-1)`, the entire spendable balance of the taker
    ///        will be solt.
    /// @param minOutputTokenAmount The minimum amount of `outputToken` the taker
    ///        must receive for the entire transformation to succeed. If set to zero,
    ///        the minimum output token transfer will not be asserted.
    /// @param transformations The transformations to execute on the token balance(s)
    ///        in sequence.
    /// @return outputTokenAmount The amount of `outputToken` received by the taker.
    function _transformERC20Private(
        bytes32 callDataHash,
        address payable taker,
        IERC20TokenV06 inputToken,
        IERC20TokenV06 outputToken,
        uint256 inputTokenAmount,
        uint256 minOutputTokenAmount,
        Transformation[] memory transformations
    )
        public
        payable
        returns (uint256 outputTokenAmount)
    {
        // If the input token amount is -1, transform the taker's entire
        // spendable balance.
        if (inputTokenAmount == uint256(-1)) {
            inputTokenAmount = ITokenSpender(address(this))
                .getSpendableERC20BalanceOf(inputToken, taker);
        }

        IFlashWallet wallet = getTransformWallet();

        // Remember the initial output token balance of the taker.
        uint256 takerOutputTokenBalanceBefore =
            LibERC20Transformer.getTokenBalanceOf(outputToken, taker);

        // Pull input tokens from the taker to the wallet and transfer attached ETH.
        _transferInputTokensAndAttachedEth(inputToken, taker, address(wallet), inputTokenAmount);

        // Perform transformations.
        for (uint256 i = 0; i < transformations.length; ++i) {
            _executeTransformation(wallet, transformations[i], taker, callDataHash);
        }

        // Compute how much output token has been transferred to the taker.
        uint256 takerOutputTokenBalanceAfter =
            LibERC20Transformer.getTokenBalanceOf(outputToken, taker);
        if (takerOutputTokenBalanceAfter > takerOutputTokenBalanceBefore) {
            outputTokenAmount = takerOutputTokenBalanceAfter.safeSub(
                takerOutputTokenBalanceBefore
            );
        }
        // Ensure enough output token has been sent to the taker.
        if (outputTokenAmount < minOutputTokenAmount) {
            LibTransformERC20RichErrors.IncompleteERC20TransformError(
                address(outputToken),
                outputTokenAmount,
                minOutputTokenAmount
            ).rrevert();
        }

        // Emit an event.
        emit TransformedERC20(
            taker,
            address(inputToken),
            address(outputToken),
            inputTokenAmount,
            outputTokenAmount
        );
    }

    /// @dev Return the current wallet instance that will serve as the execution
    ///      context for transformations.
    /// @return wallet The wallet instance.
    function getTransformWallet()
        public
        override
        view
        returns (IFlashWallet wallet)
    {
        return LibTransformERC20Storage.getStorage().wallet;
    }

    /// @dev Transfer input tokens from the taker and any attached ETH to `to`
    /// @param inputToken The token to pull from the taker.
    /// @param from The from (taker) address.
    /// @param to The recipient of tokens and ETH.
    /// @param amount Amount of `inputToken` tokens to transfer.
    function _transferInputTokensAndAttachedEth(
        IERC20TokenV06 inputToken,
        address from,
        address payable to,
        uint256 amount
    )
        private
    {
        // Transfer any attached ETH.
        if (msg.value != 0) {
            to.transfer(msg.value);
        }
        // Transfer input tokens.
        if (!LibERC20Transformer.isTokenETH(inputToken)) {
            // Token is not ETH, so pull ERC20 tokens.
            ITokenSpender(address(this))._spendERC20Tokens(
                inputToken,
                from,
                to,
                amount
            );
        } else if (msg.value < amount) {
             // Token is ETH, so the caller must attach enough ETH to the call.
            LibTransformERC20RichErrors.InsufficientEthAttachedError(
                msg.value,
                amount
            ).rrevert();
        }
    }

    /// @dev Executs a transformer in the context of `wallet`.
    /// @param wallet The wallet instance.
    /// @param transformation The transformation.
    /// @param taker The taker address.
    /// @param callDataHash Hash of the calldata.
    function _executeTransformation(
        IFlashWallet wallet,
        Transformation memory transformation,
        address payable taker,
        bytes32 callDataHash
    )
        private
    {
        // Call `transformer.transform()` as the wallet.
        bytes memory resultData = wallet.executeDelegateCall(
            // Call target.
            address(uint160(address(transformation.transformer))),
            // Call data.
            abi.encodeWithSelector(
                IERC20Transformer.transform.selector,
                callDataHash,
                taker,
                transformation.data
            )
        );
        // Ensure the transformer returned its valid nonce.
        bytes memory rlpNonce = abi.decode(resultData, (bytes));
        if (_getExpectedDeployment(rlpNonce) != address(transformation.transformer)) {
            LibTransformERC20RichErrors.UnauthorizedTransformerError(
                address(transformation.transformer),
                rlpNonce
            ).rrevert();
        }
    }

    /// @dev Compute the expected deployment address by `transformDeployer` at
    ///      the nonce given by `rlpNonce`.
    /// @param rlpNonce The RLP-encoded nonce that
    ///        the deployer had when deploying a contract.
    /// @return deploymentAddress The deployment address.
    function _getExpectedDeployment(bytes memory rlpNonce)
        private
        view
        returns (address deploymentAddress)
    {
        // See https://github.com/ethereum/wiki/wiki/RLP for RLP encoding rules.
        // The RLP-encoded nonce may be prefixed with a length byte.
        // We only support nonces up to 32-bits.
        if (rlpNonce.length == 0 || rlpNonce.length > 5) {
            LibTransformERC20RichErrors.InvalidRLPNonceError(rlpNonce).rrevert();
        }
        return address(uint160(uint256(keccak256(abi.encodePacked(
            byte(uint8(0xC0 + 21 + rlpNonce.length)),
            byte(uint8(0x80 + 20)),
            transformDeployer,
            rlpNonce
        )))));
    }
}
