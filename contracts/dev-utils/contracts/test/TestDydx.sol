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

pragma solidity ^0.5.16;
pragma experimental ABIEncoderV2;

import "@0x/contracts-asset-proxy/contracts/src/interfaces/IDydx.sol";
import "@0x/contracts-erc20/contracts/src/LibERC20Token.sol";


// solhint-disable separate-by-one-line-in-contract
contract TestDydx {

    struct OperatorConfig {
        address owner;
        address operator;
    }

    struct AccountConfig {
        address owner;
        uint256 accountId;
        int256[] balances;
    }

    struct MarketInfo {
        address token;
        uint256 price;
    }

    struct TestConfig {
        uint256 marginRatio;
        OperatorConfig[] operators;
        AccountConfig[] accounts;
        MarketInfo[] markets;
    }

    mapping (bytes32 => bool) private _operators;
    mapping (bytes32 => int256) private _balance;
    MarketInfo[] private _markets;
    uint256 private _marginRatio;

    constructor(TestConfig memory config) public {
        _marginRatio = config.marginRatio;
        for (uint256 marketId = 0; marketId < config.markets.length; ++marketId) {
            _markets.push(config.markets[marketId]);
        }
        for (uint256 i = 0; i < config.operators.length; ++i) {
            OperatorConfig memory op = config.operators[i];
            _operators[_getOperatorHash(op.owner, op.operator)] = true;
        }
        for (uint256 i = 0; i < config.accounts.length; ++i) {
            AccountConfig memory acct = config.accounts[i];
            for (uint256 marketId = 0; marketId < acct.balances.length; ++marketId) {
                _balance[_getBalanceHash(acct.owner, acct.accountId, marketId)] =
                    acct.balances[marketId];
            }
        }
    }

    function getIsLocalOperator(
        address owner,
        address operator
    )
        external
        view
        returns (bool isLocalOperator)
    {
        return _operators[_getOperatorHash(owner, operator)];
    }

    function getMarketTokenAddress(
        uint256 marketId
    )
        external
        view
        returns (address tokenAddress)
    {
        return _markets[marketId].token;
    }

    function getRiskParams()
        external
        view
        returns (IDydx.RiskParams memory riskParams)
    {
        return IDydx.RiskParams({
            marginRatio: IDydx.D256(_marginRatio),
            liquidationSpread: IDydx.D256(0),
            earningsRate: IDydx.D256(0),
            minBorrowedValue: IDydx.Value(0)
        });
    }

    function getMarketPrice(
        uint256 marketId
    )
        external
        view
        returns (IDydx.Price memory price)
    {
        return IDydx.Price(_markets[marketId].price);
    }

    function getAdjustedAccountValues(
        IDydx.AccountInfo calldata account
    )
        external
        view
        returns (IDydx.Value memory supplyValue, IDydx.Value memory borrowValue)
    {
        for (uint256 marketId = 0; marketId < _markets.length; ++marketId) {
            MarketInfo memory market = _markets[marketId];
            int256 balance =
                _balance[_getBalanceHash(account.owner, account.number, marketId)];
            uint256 decimals = LibERC20Token.decimals(market.token);
            balance = balance * int256(market.price) / int256(10 ** decimals);
            if (balance >= 0) {
                supplyValue.value += uint256(balance);
            } else {
                borrowValue.value += uint256(-balance);
            }
        }
    }

    function _getOperatorHash(address owner, address operator)
        private
        pure
        returns (bytes32 operatorHash)
    {
        return keccak256(abi.encode(
            owner,
            operator
        ));
    }

    function _getBalanceHash(address owner, uint256 accountId, uint256 marketId)
        private
        pure
        returns (bytes32 balanceHash)
    {
        return keccak256(abi.encode(
            owner,
            accountId,
            marketId
        ));
    }
}
