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
import "@0x/contracts-utils/contracts/src/DeploymentConstants.sol";
import "@0x/contracts-utils/contracts/src/LibSafeMath.sol";
import "../interfaces/IERC20Bridge.sol";


// solhint-disable space-after-comma
/// @dev A bridge that converts the taker's WETH to ETH in-place.
///      An order should use this bridge in the maker asset data with a no-op
///      taker asset. This contract also doubles as a pseudo-ERC20 token that
///      implements a `balanceOf()` function, which echoes the ETH balance of
///      an address, for the ERC20BridgeProxy to check.
contract WethUnwrapBridge is
    IERC20Bridge,
    IWallet,
    DeploymentConstants
{
    using LibSafeMath for uint256;

    // solhint-disable no-empty-blocks
    /// @dev Payable fallback to receive ETH from the WETH contract.
    function ()
        external
        payable
    {}

    /// @dev Converts `to`'s WETH to ETH. `to` must have previously set a
    ///      WETH allowance for this contract. Only callable by the ERC20BridgeProxy.
    /// @param from The maker (this contract).
    /// @param to The recipient of the bought tokens.
    /// @param bridgeData The abi-encoded maximum amount to unwrap.
    /// @return success The magic bytes if successful.
    function bridgeTransferFrom(
        address /* outputTokenAddress */,
        address from,
        address to,
        uint256 /* amount */,
        bytes calldata bridgeData
    )
        external
        returns (bytes4 success)
    {
        // Must be called by the `ERC20BridgeProxy`.
        require(msg.sender == _getERC20BridgeProxyAddress(), "WethUnwrapBridge/INVALID_CALLER");
        // `from` (maker) must be this contract.
        require(from == address(this), "WethUnwrapBridge/INVALID_FROM");

        uint256 maxUnwrapAmount = abi.decode(bridgeData, (uint256));
        IEtherToken weth = IEtherToken(_getWethAddress());

        // Determine how much to unwrap.
        uint256 unwrapAmount = LibSafeMath.min256(maxUnwrapAmount, weth.balanceOf(to));
        // Transfer WETH from the owner into this contract.
        weth.transferFrom(to, address(this), unwrapAmount);
        // Convert to ETH.
        weth.withdraw(unwrapAmount);
        // Transfer ETH to the owner.
        address(uint160(to)).transfer(unwrapAmount);

        emit ERC20BridgeTransfer(
            address(weth),
            address(0),
            unwrapAmount,
            unwrapAmount,
            to,
            to
        );
        return BRIDGE_SUCCESS;
    }

    /// @dev `SignatureType.Wallet` callback, so that this bridge can be the maker
    ///      and sign for itself in orders. Always succeeds.
    /// @return magicValue Success bytes, always.
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

    /// @dev An ERC20 `balanceOf()` implementation that just echoes the ETH balance
    ///      of an address. This is so this contract can double as the token
    ///      in orders that are designed to unwrap WETH.
    /// @param owner The address of the token owner.
    /// @return ethBalance The ETH balance of `owner`.
    function balanceOf(address owner)
        external
        view
        returns (uint256 ethBalance)
    {
        return owner.balance;
    }
}
