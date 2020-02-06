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


interface IDydx {

    /// @dev Represents the unique key that specifies an account
    struct AccountInfo {
        address owner;  // The address that owns the account
        uint256 number; // A nonce that allows a single address to control many accounts
    }

    enum ActionType {
        Deposit,   // supply tokens
        Withdraw,  // borrow tokens
        Transfer,  // transfer balance between accounts
        Buy,       // buy an amount of some token (externally)
        Sell,      // sell an amount of some token (externally)
        Trade,     // trade tokens against another account
        Liquidate, // liquidate an undercollateralized or expiring account
        Vaporize,  // use excess tokens to zero-out a completely negative account
        Call       // send arbitrary data to an address
    }

    /// @dev Arguments that are passed to Solo in an ordered list as part of a single operation.
    /// Each ActionArgs has an actionType which specifies which action struct that this data will be
    /// parsed into before being processed.
    struct ActionArgs {
        ActionType actionType;
        uint256 accountIdx;
        AssetAmount amount;
        uint256 primaryMarketId;
        uint256 secondaryMarketId;
        address otherAddress;
        uint256 otherAccountIdx;
        bytes data;
    }

    enum AssetDenomination {
        Wei, // the amount is denominated in wei
        Par  // the amount is denominated in par
    }

    enum AssetReference {
        Delta, // the amount is given as a delta from the current value
        Target // the amount is given as an exact number to end up at
    }

    struct AssetAmount {
        bool sign; // true if positive
        AssetDenomination denomination;
        AssetReference ref;
        uint256 value;
    }

    struct D256 {
        uint256 value;
    }

    struct Value {
        uint256 value;
    }

    struct Price {
        uint256 value;
    }

    struct OperatorArg {
        address operator;
        bool trusted;
    }

    /// @dev The global risk parameters that govern the health and security of the system
    struct RiskParams {
        // Required ratio of over-collateralization
        D256 marginRatio;
        // Percentage penalty incurred by liquidated accounts
        D256 liquidationSpread;
        // Percentage of the borrower's interest fee that gets passed to the suppliers
        D256 earningsRate;
        // The minimum absolute borrow value of an account
        // There must be sufficient incentivize to liquidate undercollateralized accounts
        Value minBorrowedValue;
    }

    /// @dev The main entry-point to Solo that allows users and contracts to manage accounts.
    ///      Take one or more actions on one or more accounts. The msg.sender must be the owner or
    ///      operator of all accounts except for those being liquidated, vaporized, or traded with.
    ///      One call to operate() is considered a singular "operation". Account collateralization is
    ///      ensured only after the completion of the entire operation.
    /// @param  accounts  A list of all accounts that will be used in this operation. Cannot contain
    ///                   duplicates. In each action, the relevant account will be referred-to by its
    ///                   index in the list.
    /// @param  actions   An ordered list of all actions that will be taken in this operation. The
    ///                   actions will be processed in order.
    function operate(
        AccountInfo[] calldata accounts,
        ActionArgs[] calldata actions
    )
        external;

    // @dev Approves/disapproves any number of operators. An operator is an external address that has the
    //      same permissions to manipulate an account as the owner of the account. Operators are simply
    //      addresses and therefore may either be externally-owned Ethereum accounts OR smart contracts.
    //      Operators are also able to act as AutoTrader contracts on behalf of the account owner if the
    //      operator is a smart contract and implements the IAutoTrader interface.
    // @param args A list of OperatorArgs which have an address and a boolean. The boolean value
    //        denotes whether to approve (true) or revoke approval (false) for that address.
    function setOperators(OperatorArg[] calldata args) external;

    /// @dev Return true if a particular address is approved as an operator for an owner's accounts.
    ///      Approved operators can act on the accounts of the owner as if it were the operator's own.
    /// @param owner The owner of the accounts
    /// @param operator The possible operator
    /// @return isLocalOperator True if operator is approved for owner's accounts
    function getIsLocalOperator(
        address owner,
        address operator
    )
        external
        view
        returns (bool isLocalOperator);

    /// @dev Get the ERC20 token address for a market.
    /// @param marketId The market to query
    /// @return tokenAddress The token address
    function getMarketTokenAddress(
        uint256 marketId
    )
        external
        view
        returns (address tokenAddress);

    /// @dev Get all risk parameters in a single struct.
    /// @return riskParams All global risk parameters
    function getRiskParams()
        external
        view
        returns (RiskParams memory riskParams);

    /// @dev Get the price of the token for a market.
    /// @param marketId The market to query
    /// @return price The price of each atomic unit of the token
    function getMarketPrice(
        uint256 marketId
    )
        external
        view
        returns (Price memory price);

    /// @dev Get the margin premium for a market. A margin premium makes it so that any positions that
    ///      include the market require a higher collateralization to avoid being liquidated.
    /// @param  marketId  The market to query
    /// @return premium The market's margin premium
    function getMarketMarginPremium(uint256 marketId)
        external
        view
        returns (D256 memory premium);

    /// @dev Get the total supplied and total borrowed values of an account adjusted by the marginPremium
    ///      of each market. Supplied values are divided by (1 + marginPremium) for each market and
    ///      borrowed values are multiplied by (1 + marginPremium) for each market. Comparing these
    ///      adjusted values gives the margin-ratio of the account which will be compared to the global
    ///      margin-ratio when determining if the account can be liquidated.
    /// @param account The account to query
    /// @return supplyValue The supplied value of the account (adjusted for marginPremium)
    /// @return borrowValue The borrowed value of the account (adjusted for marginPremium)
    function getAdjustedAccountValues(
        AccountInfo calldata account
    )
        external
        view
        returns (Value memory supplyValue, Value memory borrowValue);
}
