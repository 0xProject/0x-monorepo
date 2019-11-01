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

import "./TestRefundable.sol";


contract TestRefundableReceiver {

    /// @dev A payable fallback function is necessary to receive refunds from the `TestRefundable` contract.
    ///      This function ensures that zero value is not sent to the contract, which tests the feature of
    ///      of the `refundNonzeroBalance` that doesn't transfer if the balance is zero.
    function ()
        external
        payable
    {
        // Ensure that a value of zero was not transferred to the contract.
        require(msg.value != 0, "Zero value should not be sent to this contract.");
    }

    /// @dev This function tests the behavior of the `refundNonzeroBalance` function by checking whether or
    ///      not the `callCounter` state variable changes after the `refundNonzeroBalance` is called.
    /// @param testRefundable The TestRefundable that should be tested against.
    function testRefundNonZeroBalance(TestRefundable testRefundable)
        external
        payable
    {
        // Call `refundNonzeroBalance()` and forward all of the eth sent to the contract.
        testRefundable.refundNonZeroBalanceExternal.value(msg.value)();

        // If the value sent was nonzero, a check that a refund was received will be executed. Otherwise, the fallback
        // function contains a check that will fail in the event that a value of zero was sent to the contract.
        if (msg.value > 0) {
            // Ensure that a full refund was provided to this contract.
            require(address(this).balance == msg.value, "A full refund was not provided by `refundNonzeroBalance`");
        }
    }

    /// @dev This function tests the behavior to a simple call to `refundFinalBalanceFunction`. This
    ///      test will verify that the correct refund was provided after the call (depending on whether
    ///      a refund should be provided), and it will ensure that the `shouldNotRefund` state variable
    ///      remains unaltered after the function call.
    /// @param testRefundable The TestRefundable that should be tested against.
    /// @param shouldNotRefund The value that shouldNotRefund should be set to before the call to TestRefundable.
    function testRefundFinalBalance(
        TestRefundable testRefundable,
        bool shouldNotRefund
    )
        external
        payable
    {
        // Set `shouldNotRefund` to the specified bool.
        testRefundable.setShouldNotRefund(shouldNotRefund);

        // Call `refundFinalBalanceFunction` and forward all value from the contract.
        testRefundable.refundFinalBalanceFunction.value(msg.value)();

        // Assert that the expected refunds happened and that the `shouldNotRefund` value was
        // set back to an unaltered state after the call.
        requireCorrectFinalBalancesAndState(testRefundable, shouldNotRefund);
    }

    /// @dev This function tests the behavior to a simple call to `disableRefundUntilEndFunction`. This
    ///      test will verify that the correct refund was provided after the call (depending on whether
    ///      a refund should be provided), and it will ensure that the `shouldNotRefund` state variable
    ///      remains unaltered after the function call.
    /// @param testRefundable The TestRefundable that should be tested against.
    /// @param shouldNotRefund The value that shouldNotRefund should be set to before the call to TestRefundable.
    function testDisableRefundUntilEnd(
        TestRefundable testRefundable,
        bool shouldNotRefund
    )
        external
        payable
    {
        // Set `shouldNotRefund` to the specified bool.
        testRefundable.setShouldNotRefund(shouldNotRefund);

        // Call `disableRefundUntilEndFunction` and forward all value from the contract.
        testRefundable.disableRefundUntilEndFunction.value(msg.value)();

        // Assert that the expected refunds happened and that the `shouldNotRefund` value was
        // set back to an unaltered state after the call.
        requireCorrectFinalBalancesAndState(testRefundable, shouldNotRefund);
    }

    /// @dev This function tests the behavior of a call to a function that has the `disableRefundUntilEndFunction`.
    ///      The function that is called also uses the `disableRefundUntilEndFunction`, so this function's role is
    ///      to verify that both the inner and outer modifiers worked correctly.
    /// @param testRefundable The TestRefundable that should be tested against.
    /// @param shouldNotRefund The value that shouldNotRefund should be set to before the call to TestRefundable.
    function testNestedDisableRefundUntilEnd(
        TestRefundable testRefundable,
        bool shouldNotRefund
    )
        external
        payable
    {
        // Set `shouldNotRefund` to the specified bool.
        testRefundable.setShouldNotRefund(shouldNotRefund);

        // Call `nestedDisableRefundUntilEndFunction` and forward all value from the contract.
        uint256 balanceWithinCall = testRefundable.nestedDisableRefundUntilEndFunction.value(msg.value)();

        // Ensure that the balance within the call was equal to `msg.value` since the inner refund should
        // not have been triggered regardless of the value of `shouldNotRefund`.
        require(balanceWithinCall == msg.value, "Incorrect inner balance");

        // Assert that the expected refunds happened and that the `shouldNotRefund` value was
        // set back to an unaltered state after the call.
        requireCorrectFinalBalancesAndState(testRefundable, shouldNotRefund);
    }

    /// @dev This function tests the behavior of a call to a function that has the `disableRefundUntilEndFunction`.
    ///      The function that is called uses the `refundFinalBalanceFunction`, so this function's role is
    ///      to verify that both the inner and outer modifiers worked correctly.
    /// @param testRefundable The TestRefundable that should be tested against.
    /// @param shouldNotRefund The value that shouldNotRefund should be set to before the call to TestRefundable.
    function testMixedRefunds(
        TestRefundable testRefundable,
        bool shouldNotRefund
    )
        external
        payable
    {
        // Set `shouldNotRefund` to the specified bool.
        testRefundable.setShouldNotRefund(shouldNotRefund);

        // Call `mixedRefundModifierFunction` and forward all value from the contract.
        uint256 balanceWithinCall = testRefundable.mixedRefundModifierFunction.value(msg.value)();

        // Ensure that the balance within the call was equal to `msg.value` since the inner refund should
        // not have been triggered regardless of the value of `shouldNotRefund`.
        require(balanceWithinCall == msg.value, "Incorrect inner balance");

        // Assert that the expected refunds happened and that the `shouldNotRefund` value was
        // set back to an unaltered state after the call.
        requireCorrectFinalBalancesAndState(testRefundable, shouldNotRefund);
    }

    /// @dev This helper function verifies the final balances of this receiver contract and a specified
    ///      refundable contract and verifies that the `shouldNotRefund` value remains unaltered.
    /// @param testRefundable The TestRefundable that should be tested against.
    /// @param shouldNotRefund The value that shouldNotRefund was set to before the call to TestRefundable.
    function requireCorrectFinalBalancesAndState(
        TestRefundable testRefundable,
        bool shouldNotRefund
    )
        internal
    {
        // If `shouldNotRefund` was true, then this contract should have a balance of zero,
        // and `testRefundable` should have a balance of `msg.value`. Otherwise, the opposite
        // should be true.
        if (shouldNotRefund) {
            // Ensure that this contract's balance is zero.
            require(address(this).balance == 0, "Incorrect balance for TestRefundableReceiver");

            // Ensure that the other contract's balance is equal to `msg.value`.
            require(address(testRefundable).balance == msg.value, "Incorrect balance for TestRefundable");
        } else {
            // Ensure that this contract's balance is `msg.value`.
            require(address(this).balance == msg.value, "Incorrect balance for TestRefundableReceiver");

            // Ensure that the other contract's balance is equal to zero.
            require(address(testRefundable).balance == 0, "Incorrect balance for TestRefundable");
        }

        // Ensure that `shouldNotRefund` in TestRefundable is set to the parameter `shouldNotRefund`
        // after the call (i.e. the value didn't change during the function call).
        require(testRefundable.getShouldNotRefund() == shouldNotRefund, "Incorrect shouldNotRefund value");

        // Drain the contract of funds so that subsequent tests don't have to account for leftover ether.
        msg.sender.transfer(address(this).balance);
    }
}
