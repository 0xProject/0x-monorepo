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

import "@0x/contracts-utils/contracts/src/v06/errors/LibRichErrorsV06.sol";
import "@0x/contracts-utils/contracts/src/v06/LibSafeMathV06.sol";
import "@0x/contracts-erc20/contracts/src/v06/IERC20TokenV06.sol";
import "@0x/contracts-erc20/contracts/src/v06/LibERC20TokenV06.sol";
import "../errors/LibSpenderRichErrors.sol";
import "../fixins/FixinCommon.sol";
import "../migrations/LibMigrate.sol";
import "../puppets/IPuppet.sol";
import "../puppets/IPuppet.sol";
import "../storage/LibTokenSpenderStorage.sol";
import "./ITokenSpender.sol";
import "./IFeature.sol";
import "./ISimpleFunctionRegistry.sol";


/// @dev Feature that allows spending token allowances.
contract TokenSpender is
    IFeature,
    ITokenSpender,
    FixinCommon
{
    // solhint-disable const-name-snakecase,indent
    /// @dev Name of this feature.
    string constant public override FEATURE_NAME = "TokenSpender";
    /// @dev Version of this feature.
    uint256 constant public override FEATURE_VERSION = (1 << 64) | (0 << 32) | (0);
    // solhint-enable const-name-snakecase

    /// @dev The implementation address of this feature.
    address private immutable _impl;

    using LibRichErrorsV06 for bytes;

    constructor() public {
        _impl = address(this);
    }

    /// @dev Initialize and register this feature. Should be delegatecalled
    ///      into during a `Migrate.migrate()`.
    /// @param puppet A `Puppet` contract, which will be the target of user
    ///        allowances, configured to have the ZeroeEx contract as an
    ///        authority.
    /// @return success `MIGRATE_SUCCESS` on success.
    function migrate(IPuppet puppet) external returns (bytes4 success) {
        LibTokenSpenderStorage.getStorage().spender = puppet;
        ISimpleFunctionRegistry(address(this))
            .extend(this.getTokenSpenderPuppet.selector, _impl);
        ISimpleFunctionRegistry(address(this))
            .extend(this._spendERC20Tokens.selector, _impl);
        ISimpleFunctionRegistry(address(this))
            .extend(this.getSpendableERC20BalanceOf.selector, _impl);
        return LibMigrate.MIGRATE_SUCCESS;
    }

    /// @dev Transfers ERC20 tokens to `to` from allowance granted by `owner`
    ///      to the puppet spender contract.
    ///      Only callable from within.
    /// @param token The token to spend.
    /// @param owner The owner of the tokens.
    /// @param to The recipient of the tokens.
    /// @param amount The amount of `token` to transfer.
    function _spendERC20Tokens(
        IERC20TokenV06 token,
        address owner,
        address to,
        uint256 amount
    )
        external
        override
        onlySelf
    {
        IPuppet spender = LibTokenSpenderStorage.getStorage().spender;
        // Have the puppet spender execute an ERC20 `transferFrom()`.
        (bool didSucceed, bytes memory resultData) = address(spender).call(
            abi.encodeWithSelector(
                IPuppet.execute.selector,
                address(token),
                abi.encodeWithSelector(
                    IERC20TokenV06.transferFrom.selector,
                    owner,
                    to,
                    amount
                ),
                0
            )
        );
        if (didSucceed) {
            resultData = abi.decode(resultData, (bytes));
        }
        if (!didSucceed || !LibERC20TokenV06.isSuccessfulResult(resultData)) {
            LibSpenderRichErrors.SpenderERC20TransferFromFailedError(
                address(token),
                owner,
                to,
                amount,
                resultData
            ).rrevert();
        }
    }

    /// @dev Gets the maximum amount of an ERC20 token `token` that can be
    ///      pulled from `owner` by the token spender.
    /// @param token The token to spend.
    /// @param owner The owner of the tokens.
    /// @return amount The amount of tokens that can be pulled.
    function getSpendableERC20BalanceOf(IERC20TokenV06 token, address owner)
        external
        override
        view
        returns (uint256 amount)
    {
        return LibSafeMathV06.min256(
            token.allowance(owner, address(LibTokenSpenderStorage.getStorage().spender)),
            token.balanceOf(owner)
        );
    }

    /// @dev Get the instance of the token spender puppet.
    ///      This should be the target of user allowances.
    /// @return puppet The token spender puppet.
    function getTokenSpenderPuppet()
        external
        override
        view
        returns (IPuppet puppet)
    {
        return LibTokenSpenderStorage.getStorage().spender;
    }
}
