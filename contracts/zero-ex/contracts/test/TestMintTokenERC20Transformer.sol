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

import "../src/transformers/IERC20Transformer.sol";
import "../src/transformers/LibERC20Transformer.sol";
import "./TestMintableERC20Token.sol";


contract TestMintTokenERC20Transformer is
    IERC20Transformer
{
    struct TransformData {
        TestMintableERC20Token tokenToMint;
        uint256 mintAmount;
        address mintTo;
    }

    event MintTransform(
        address caller,
        bytes32 callDataHash,
        address taker,
        IERC20TokenV06[] tokens,
        uint256[] amounts,
        bytes data
    );

    function transform(
        bytes32 callDataHash,
        address payable taker,
        IERC20TokenV06[] calldata tokens,
        uint256[] calldata amounts,
        bytes calldata data_
    )
        external
        override
        payable
        returns (bytes4 success)
    {
        _assertBalances(tokens, amounts);
        emit MintTransform(
            msg.sender,
            callDataHash,
            taker,
            tokens,
            amounts,
            data_
        );
        TransformData memory data = abi.decode(data_, (TransformData));
        // Return input tokens.
        for (uint256 i = 0; i < tokens.length; ++i) {
            LibERC20Transformer.transformerTransfer(tokens[i], msg.sender, amounts[i]);
        }
        // Mint output tokens.
        require(
            !LibERC20Transformer.isTokenETH(IERC20TokenV06(address(data.tokenToMint))),
            "TestMintTokenERC20Transformer/INVALID_MINT_TOKEN"
        );
        data.tokenToMint.mint(
            data.mintTo == address(0) ? msg.sender : data.mintTo,
            data.mintAmount
        );
        return LibERC20Transformer.TRANSFORMER_SUCCESS;
    }

    function _assertBalances(
        IERC20TokenV06[] memory tokens,
        uint256[] memory amounts
    )
        private
        view
    {
        for (uint256 i = 0; i < tokens.length; ++i) {
            // Technically a zero amount is perfectly legal, but the tests should
            // never result in a zero amount transfer.
            require(amounts[i] != 0, "TestMintTokenERC20Transformer/ZERO_AMOUNT");
            uint256 bal = LibERC20Transformer.getTokenBalanceOf(tokens[i], address(this));
            require(amounts[i] == bal,
                "TestMintTokenERC20Transformer/AMOUNT_BALANCE_MISMATCH"
            );
        }
    }
}
