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


library LibTransformERC20RichErrors {

    // solhint-disable func-name-mixedcase,separate-by-one-line-in-contract

    function InsufficientEthAttachedError(
        uint256 ethAttached,
        uint256 ethNeeded
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            bytes4(keccak256("InsufficientEthAttachedError(uint256,uint256)")),
            ethAttached,
            ethNeeded
        );
    }

    function IncompleteERC20TransformError(
        address outputToken,
        uint256 outputTokenAmount,
        uint256 minOutputTokenAmount
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            bytes4(keccak256("IncompleteERC20TransformError(address,uint256,uint256)")),
            outputToken,
            outputTokenAmount,
            minOutputTokenAmount
        );
    }

    function TransferERC20FailedError(
        address token,
        address to,
        uint256 amount
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            bytes4(keccak256("TransferERC20FailedError(address,address,uint256)")),
            token,
            to,
            amount
        );
    }

    function ERC20TransformerFailedError(
        address transformer,
        address[] memory tokens,
        uint256[] memory amounts
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            bytes4(keccak256("ERC20TransformerFailedError(address,address[],uint256[])")),
            transformer,
            tokens,
            amounts
        );
    }

    function InvalidTransformationError(
        address transformer,
        address[] memory tokens,
        uint256[] memory amounts,
        bytes memory data
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            bytes4(keccak256("InvalidTransformationError(address,address[],uint256[],bytes)")),
            transformer,
            tokens,
            amounts,
            data
        );
    }

    // FillQuoteTransformer errors /////////////////////////////////////////////

    function IncompleteFillSellQuoteError(
        address sellToken,
        uint256 soldAmount,
        uint256 sellAmount
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            bytes4(keccak256("IncompleteFillSellQuoteError(address,uint256,uint256)")),
            sellToken,
            soldAmount,
            sellAmount
        );
    }

    function IncompleteFillBuyQuoteError(
        address buyToken,
        uint256 boughtAmount,
        uint256 buyAmount
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            bytes4(keccak256("IncompleteFillBuyQuoteError(address,uint256,uint256)")),
            buyToken,
            boughtAmount,
            buyAmount
        );
    }

    function InsufficientTakerTokenError(
        uint256 tokenBalance,
        uint256 tokensNeeded
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            bytes4(keccak256("InsufficientTakerTokenError(uint256,uint256)")),
            tokenBalance,
            tokensNeeded
        );
    }

    function InsufficientProtocolFeeError(
        uint256 ethBalance,
        uint256 ethNeeded
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            bytes4(keccak256("InsufficientProtocolFeeError(uint256,uint256)")),
            ethBalance,
            ethNeeded
        );
    }

    function InvalidERC20AssetDataError(
        bytes memory assetData
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            bytes4(keccak256("InvalidERC20AssetDataError(bytes)")),
            assetData
        );
    }

    // WethTransformer rors ////////////////////////////////////////////////////

    function WrongNumberOfTokensReceivedError(
        uint256 actual,
        uint256 expected
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            bytes4(keccak256("WrongNumberOfTokensReceivedError(uint256,uint256)")),
            actual,
            expected
        );
    }

    function InvalidTokenReceivedError(
        address token
    )
        internal
        pure
        returns (bytes memory)
    {
        return abi.encodeWithSelector(
            bytes4(keccak256("InvalidTokenReceivedError(address)")),
            token
        );
    }
}
