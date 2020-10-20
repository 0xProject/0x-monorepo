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
pragma solidity ^0.6;
pragma experimental ABIEncoderV2;

import "../src/NativeOrderSampler.sol";


contract TestNativeOrderSamplerToken {
    mapping (address => uint256) public balanceOf;
    mapping (address => mapping(address => uint256)) public allowance;

    function setBalanceAndAllowance(
        address owner,
        address spender,
        uint256 balance,
        uint256 allowance_
    )
        external
    {
        balanceOf[owner] = balance;
        allowance[owner][spender] = allowance_;
    }
}

contract TestNativeOrderSampler is
    NativeOrderSampler
{
    uint8 private constant MAX_ORDER_STATUS = uint8(IExchange.OrderStatus.CANCELLED) + 1;
    bytes32 private constant VALID_SIGNATURE_HASH = keccak256(hex"01");

    function createTokens(uint256 count)
        external
        returns (TestNativeOrderSamplerToken[] memory tokens)
    {
        tokens = new TestNativeOrderSamplerToken[](count);
        for (uint256 i = 0; i < count; ++i) {
            tokens[i] = new TestNativeOrderSamplerToken();
        }
    }

    function setTokenBalanceAndAllowance(
        TestNativeOrderSamplerToken token,
        address owner,
        address spender,
        uint256 balance,
        uint256 allowance
    )
        external
    {
        token.setBalanceAndAllowance(owner, spender, balance, allowance);
    }

    // IExchange.getAssetProxy()
    function getAssetProxy(bytes4 proxyId)
        public
        pure
        returns (address)
    {
        return address(uint160(uint256(keccak256(abi.encode(proxyId)))));
    }

    // IExchange.getOrderInfo()
    function getOrderInfo(IExchange.Order calldata order)
        external
        pure
        returns (IExchange.OrderInfo memory orderInfo)
    {
        // The order salt determines everything.
        orderInfo.orderHash = keccak256(abi.encode(order.salt));
        if (uint8(order.salt) == 0xFF) {
            orderInfo.orderStatus = IExchange.OrderStatus.FULLY_FILLED;
        } else {
            orderInfo.orderStatus = IExchange.OrderStatus.FILLABLE;
        }
        // The expiration time is the filled taker asset amount.
        orderInfo.orderTakerAssetFilledAmount = order.expirationTimeSeconds;
    }

    // IExchange.isValidSignature()
    function isValidHashSignature(
        bytes32,
        address,
        bytes calldata signature
    )
        external
        pure
        returns (bool isValid)
    {
        return keccak256(signature) == VALID_SIGNATURE_HASH;
    }
}
