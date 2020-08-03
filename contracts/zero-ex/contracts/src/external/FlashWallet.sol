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
import "@0x/contracts-utils/contracts/src/v06/errors/LibOwnableRichErrorsV06.sol";
import "@0x/contracts-erc20/contracts/src/v06/LibERC20TokenV06.sol";
import "@0x/contracts-erc20/contracts/src/v06/IERC20TokenV06.sol";
import "../errors/LibWalletRichErrors.sol";
import "./IFlashWallet.sol";


/// @dev A contract that can execute arbitrary calls from its owner.
contract FlashWallet is
    IFlashWallet
{
    using LibERC20TokenV06 for IERC20TokenV06;
    // solhint-disable no-unused-vars,indent,no-empty-blocks
    using LibRichErrorsV06 for bytes;

    // solhint-disable
    /// @dev Store the owner/deployer as an immutable to make this contract stateless.
    address public override constant owner = 0xDef1C0ded9bec7F1a1670819833240f027b25EfF ;
    // solhint-enable

    //constructor() public {
    //    // The deployer is the owner.
    //    owner = msg.sender;
    //}

    function setAllowances()
        external
    {
        // ERC20Proxy DAI
        IERC20TokenV06(0x6B175474E89094C44Da98b954EedeAC495271d0F).approveIfBelow(
            0x95E6F48254609A6ee006F7D493c8e5fB97094ceF,
            uint(-1)
        );
        // ERC20Proxy  WETH
        IERC20TokenV06(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2).approveIfBelow(
            0x95E6F48254609A6ee006F7D493c8e5fB97094ceF,
            uint(-1)
        );
        // ERC20Proxy USDC
        IERC20TokenV06(0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48).approveIfBelow(
            0x95E6F48254609A6ee006F7D493c8e5fB97094ceF,
            uint(-1)
        );
        // UniswapV2 DAI
        IERC20TokenV06(0x6B175474E89094C44Da98b954EedeAC495271d0F).approveIfBelow(
            0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D,
            uint(-1)
        );
        // UniswapV2 WETH
        IERC20TokenV06(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2).approveIfBelow(
            0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D,
            uint(-1)
        );
        // UniswapV2 USDC
        IERC20TokenV06(0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48).approveIfBelow(
            0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D,
            uint(-1)
        );
        // Curve sUSD DAI
        IERC20TokenV06(0x6B175474E89094C44Da98b954EedeAC495271d0F).approveIfBelow(
            0xA5407eAE9Ba41422680e2e00537571bcC53efBfD,
            uint(-1)
        );
        // Curve sUSD USDC
        IERC20TokenV06(0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48).approveIfBelow(
            0xA5407eAE9Ba41422680e2e00537571bcC53efBfD,
            uint(-1)
        );
    }


    /// @dev Allows only the (immutable) owner to call a function.
    modifier onlyOwner() virtual {
        if (msg.sender != owner) {
            LibOwnableRichErrorsV06.OnlyOwnerError(
                msg.sender,
                owner
            ).rrevert();
        }
        _;
    }

    /// @dev Execute an arbitrary call. Only an authority can call this.
    /// @param target The call target.
    /// @param callData The call data.
    /// @param value Ether to attach to the call.
    /// @return resultData The data returned by the call.
    function executeCall(
        address payable target,
        bytes calldata callData,
        uint256 value
    )
        external
        payable
        override
        onlyOwner
        returns (bytes memory resultData)
    {
        bool success;
        (success, resultData) = target.call{value: value}(callData);
        if (!success) {
            LibWalletRichErrors
                .WalletExecuteCallFailedError(
                    address(this),
                    target,
                    callData,
                    value,
                    resultData
                )
                .rrevert();
        }
    }

    /// @dev Execute an arbitrary delegatecall, in the context of this puppet.
    ///      Only an authority can call this.
    /// @param target The call target.
    /// @param callData The call data.
    /// @return resultData The data returned by the call.
    function executeDelegateCall(
        address payable target,
        bytes calldata callData
    )
        external
        payable
        override
        onlyOwner
        returns (bytes memory resultData)
    {
        bool success;
        (success, resultData) = target.delegatecall(callData);
        if (!success) {
            LibWalletRichErrors
                .WalletExecuteDelegateCallFailedError(
                    address(this),
                    target,
                    callData,
                    resultData
                )
                .rrevert();
        }
    }

    // solhint-disable
    /// @dev Allows this contract to receive ether.
    receive() external override payable {}
    // solhint-enable

    /// @dev Signal support for receiving ERC1155 tokens.
    /// @param interfaceID The interface ID, as per ERC-165 rules.
    /// @return hasSupport `true` if this contract supports an ERC-165 interface.
    function supportsInterface(bytes4 interfaceID)
        external
        pure
        returns (bool hasSupport)
    {
        return  interfaceID == this.supportsInterface.selector ||
                interfaceID == this.onERC1155Received.selector ^ this.onERC1155BatchReceived.selector ||
                interfaceID == this.tokenFallback.selector;
    }

    ///  @dev Allow this contract to receive ERC1155 tokens.
    ///  @return success  `bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"))`
    function onERC1155Received(
        address, // operator,
        address, // from,
        uint256, // id,
        uint256, // value,
        bytes calldata //data
    )
        external
        pure
        returns (bytes4 success)
    {
        return this.onERC1155Received.selector;
    }

    ///  @dev Allow this contract to receive ERC1155 tokens.
    ///  @return success  `bytes4(keccak256("onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"))`
    function onERC1155BatchReceived(
        address, // operator,
        address, // from,
        uint256[] calldata, // ids,
        uint256[] calldata, // values,
        bytes calldata // data
    )
        external
        pure
        returns (bytes4 success)
    {
        return this.onERC1155BatchReceived.selector;
    }

    /// @dev Allows this contract to receive ERC223 tokens.
    function tokenFallback(
        address, // from,
        uint256, // value,
        bytes calldata // value
    )
        external
        pure
    {}
}
