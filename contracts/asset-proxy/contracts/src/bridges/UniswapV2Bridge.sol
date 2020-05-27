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
import "@0x/contracts-erc20/contracts/src/interfaces/IEtherToken.sol";
import "@0x/contracts-erc20/contracts/src/LibERC20Token.sol";
import "@0x/contracts-exchange-libs/contracts/src/IWallet.sol";
import "@0x/contracts-utils/contracts/src/DeploymentConstants.sol";
import "../interfaces/IUniswapV2Router01.sol";
import "../interfaces/IERC20Bridge.sol";


// solhint-disable space-after-comma
// solhint-disable not-rely-on-time
contract UniswapV2Bridge is
    IERC20Bridge,
    IWallet,
    DeploymentConstants
{

    address private constant UNISWAP_V2_ROUTER_01_ADDRESS = 0xf164fC0Ec4E93095b804a4795bBe1e041497b92a;

    /// @dev Callback for `IERC20Bridge`. Tries to buy `amount` of
    ///      `toTokenAddress` tokens by selling the entirety of the `fromTokenAddress`
    ///      token encoded in the bridge data.
    /// @param toTokenAddress The token to buy and transfer to `to`.
    /// @param from The maker (this contract).
    /// @param to The recipient of the bought tokens.
    /// @param amount Minimum amount of `toTokenAddress` tokens to buy.
    /// @param bridgeData The abi-encoded "from" token address.
    /// @return success The magic bytes if successful.
    function bridgeTransferFrom(
        address toTokenAddress,
        address from,
        address to,
        uint256 amount,
        bytes calldata bridgeData
    )
        external
        returns (bytes4 success)
    {

        // Decode the bridge data to get the `fromTokenAddress`.
        (address fromTokenAddress) = abi.decode(bridgeData, (address));

        // Just transfer the tokens if they're the same.
        if (fromTokenAddress == toTokenAddress) {
            LibERC20Token.transfer(fromTokenAddress, to, amount);
            return BRIDGE_SUCCESS;
        }

        // Get our balance of `fromTokenAddress` token.
        uint256 fromTokenBalance = IERC20Token(fromTokenAddress).balanceOf(address(this));

        // Grant the Uniswap router an allowance.
        // TODO

        // Construct the path argument to convert fromTokenAddress to toTokenAddress
        address[] memory path;
        path[0] = fromTokenAddress;
        path[1] = toTokenAddress;

        // Buy as much `toTokenAddress` token with `fromTokenAddress` token
        // and transfer it to `to`.
        IUniswapV2Router01 router = IUniswapV2Router01(UNISWAP_V2_ROUTER_01_ADDRESS);
        uint[] memory amounts = router.swapExactTokensForTokens(
             // Sell all tokens we hold.
            fromTokenBalance,
             // Minimum buy amount.
            amount,
            // Convert `fromTokenAddress` to `toTokenAddress`.
            path,
            // Recipient is `to`.
            to,
            // Expires after this block.
            block.timestamp
        );

        uint256 boughtAmount = amounts[1];

        emit ERC20BridgeTransfer(
            fromTokenAddress,
            toTokenAddress,
            fromTokenBalance,
            boughtAmount,
            from,
            to
        );
        return BRIDGE_SUCCESS;
    }
}
