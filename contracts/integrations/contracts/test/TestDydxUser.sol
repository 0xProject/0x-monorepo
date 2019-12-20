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


/// @dev THIS IS A SELF-CONTAINED CONVENIENCE CONTRACT FOR TESTING THE DYDX BRIDGE ON MAINNET.
///      Currently deployed at 0xeb58c2caa96f39626dcceb74fdbb7a9a8b54ec18.
///      Steps:
///         1. Deploy to mainnet (can copy-paste this into Remix and deploy).
///         2. Send some DAI to the contract.
///         3. Call `init()` to configure.
interface IERC20Token {

    /// @dev `msg.sender` approves `_spender` to spend `_value` tokens
    /// @param spender The address of the account able to transfer the tokens
    /// @param value The amount of wei to be approved for transfer
    /// @return Always true if the call has enough gas to complete execution
    function approve(address spender, uint256 value)
        external
        returns (bool);

    /// @dev Query the balance of owner
    /// @param owner The address from which the balance will be retrieved
    /// @return Balance of owner
    function balanceOf(address owner)
        external
        view
        returns (uint256);
}


/// @dev TestDydxUser uses this interface to interact with dydx.
interface IDydx {

    /// @dev Respresents an operator's privileges.
    struct OperatorArg {
        address operator;
        bool trusted;
    }

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
        uint256 accountId;
        AssetAmount amount;
        uint256 primaryMarketId;
        uint256 secondaryMarketId;
        address otherAddress;
        uint256 otherAccountId;
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

    /// @dev Sets operators of dydx account.
    /// @param operators to give/remove access.
    function setOperators(OperatorArg[] calldata operators)
        external;
}


/// @dev Deploy this contract and call `init` to run the mainnet DydxBridge integration tests.
contract TestDydxUser {

    address public constant DYDX_BRIDGE_ADDRESS = 0x96DdBa19b69D6EA2549f6a12d005595167414744;
    address public constant DYDX_ADDRESS = 0x1E0447b19BB6EcFdAe1e4AE1694b0C3659614e4e;
    address public constant DAI_ADDRESS = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    uint256 public constant DYDX_DAI_MARKET_ID = 3;
    bytes4 public constant MAGIC_BYTES = bytes4(keccak256("init()"));

    function init()
        public
        returns (bytes4)
    {
        // 1. Assert that this account has DAI.
        uint256 daiBalance = IERC20Token(DAI_ADDRESS).balanceOf(address(this));
        require(
            daiBalance > 0,
            "TestDydxUser/DAI_BALANCE_MUST_BE_NONZERO"
        );

        // 2. Set allowance for Dydx to transfer DAI.
        require(
            IERC20Token(DAI_ADDRESS).approve(
                DYDX_ADDRESS,
                daiBalance
            ),
            "TestDydxUser/FAILED_TO_SET_DAI_ALLOWANCE"
        );

        // 3. Add DydxBridge as operator on dydx.
        //    This will revert on failure.
        IDydx.OperatorArg[] memory operatorArgs = new IDydx.OperatorArg[](1);
        operatorArgs[0] = IDydx.OperatorArg({
            operator: DYDX_BRIDGE_ADDRESS,
            trusted: true
        });
        IDydx(DYDX_ADDRESS).setOperators(operatorArgs);

        // 4. Deposit 1/2 DAI balance into dydx. This allows us to test withdrawals.
        // 4.i Create dydx account struct.
        IDydx.AccountInfo[] memory accounts = new IDydx.AccountInfo[](1);
        accounts[0] = IDydx.AccountInfo({
            owner: address(this),
            number: 0
        });

         // 4.ii Create dydx amount.
        IDydx.AssetAmount memory dydxAmount = IDydx.AssetAmount({
            sign: true,                                 // true if positive.
            denomination: IDydx.AssetDenomination.Wei,  // Wei => actual token amount held in account.
            ref: IDydx.AssetReference.Delta,            // Delta => a relative amount.
            value: daiBalance / 2                       // amount to deposit.
        });

        // 4.iii Create dydx deposit action.
        IDydx.ActionArgs[] memory actions = new IDydx.ActionArgs[](1);
        actions[0] = IDydx.ActionArgs({
            actionType: IDydx.ActionType.Deposit,           // deposit tokens.
            amount: dydxAmount,                             // amount to deposit.
            accountId: 0,                                   // index in the `accounts` when calling `operate`.
            primaryMarketId: DYDX_DAI_MARKET_ID,            // indicates which token to deposit.
            otherAddress: address(this),                    // deposit from the account owner.
            // unused parameters
            secondaryMarketId: 0,
            otherAccountId: 0,
            data: hex''
        });

        // 4.iv Deposit DAI into dydx. This will revert on failure.
        IDydx(DYDX_ADDRESS).operate(
            accounts,
            actions
        );

        // Return magic bytes on success.
        return MAGIC_BYTES;
    }
}