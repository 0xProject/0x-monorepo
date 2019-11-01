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

import "@0x/contracts-utils/contracts/src/LibSafeMath.sol";
import "@0x/contracts-exchange-libs/contracts/src/LibOrder.sol";
import "./TestProtocolFees.sol";


// Disable solhint to allow for more informative comments.
// solhint-disable
contract TestProtocolFeesReceiver {

    // Attach LibSafeMath to uint256
    using LibSafeMath for uint256;

    /* Testing Constants */

    // A constant to represent a maker address.
    address internal constant makerAddress1 = address(1);

    // A constant to represent a maker address that is distinct from the
    // other maker address.
    address internal constant makerAddress2 = address(2);

    /* Testing State */

    // A struct that provides a schema for test data that should be logged.
    struct TestLog {
        address loggedMaker;
        address loggedPayer;
        uint256 loggedProtocolFeePaid;
        uint256 loggedValue;
    }

    // The array of testLogs that will be added to by `payProtocolFee` and processed by the tests.
    TestLog[] testLogs;

    /* Testing Functions */

    /// @dev Tests the `batchFillOrders` function's payment of protocol fees.
    /// @param testProtocolFees The TestProtocolFees that should be tested against.
    /// @param protocolFeeMultiplier The protocol fee multiplier that should be registered
    ///        in the test suite before executing `batchFillOrders`.
    /// @param numberOfOrders The number of orders that should be created and executed for this test.
    /// @param shouldSetProtocolFeeCollector A boolean value indicating whether or not this contract
    ///        should be registered as the `protocolFeeCollector`.
    function testBatchFillOrdersProtocolFees(
        TestProtocolFees testProtocolFees,
        uint256 protocolFeeMultiplier,
        uint256 numberOfOrders,
        bool shouldSetProtocolFeeCollector
    )
        external
        payable
        handleState(testProtocolFees, protocolFeeMultiplier, shouldSetProtocolFeeCollector)
    {
        // Create empty arrays for taker asset filled amounts and signatures, which will suffice for this test.
        uint256[] memory takerAssetFilledAmounts = new uint256[](numberOfOrders);
        bytes[] memory signatures = new bytes[](numberOfOrders);

        // Construct an array of orders in which every even-indexed order has a makerAddress of makerAddress1 and
        // every odd-indexed order has a makerAddress of makerAddress2. This is done to make sure that the correct
        // makers are being logged.
        LibOrder.Order[] memory orders = new LibOrder.Order[](numberOfOrders);
        for (uint256 i = 0; i < numberOfOrders; i++) {
            orders[i] = createOrder(i % 2 == 0 ? makerAddress1 : makerAddress2);
        }

        // Forward all of the value sent to the contract to `batchFillOrders()`.
        testProtocolFees.batchFillOrders.value(msg.value)(orders, takerAssetFilledAmounts, signatures);

        // If the `protocolFeeCollector` was set, ensure that the protocol fees were paid correctly.
        // Otherwise, the protocol fees should not have been paid.
        if (shouldSetProtocolFeeCollector) {
            // Ensure that the correct number of test logs were recorded.
            require(testLogs.length == numberOfOrders, "Incorrect number of test logs in batchFillOrders test");

            // Calculate the expected protocol fee.
            uint256 expectedProtocolFeePaid = tx.gasprice.safeMul(protocolFeeMultiplier);

            // Set the expected available balance for the first log.
            uint256 expectedAvailableBalance = msg.value;

            // Verify all of the test logs.
            for (uint256 i = 0; i < testLogs.length; i++) {
                // Verify the logged data.
                verifyTestLog(
                    testLogs[i],
                    expectedAvailableBalance,                    // expectedAvailableBalance
                    i % 2 == 0 ? makerAddress1 : makerAddress2,  // expectedMakerAddress
                    address(this),                               // expectedPayerAddress
                    expectedProtocolFeePaid                      // expectedProtocolFeePaid
                );

                // Set the expected available balance for the next log.
                expectedAvailableBalance = expectedAvailableBalance >= expectedProtocolFeePaid ?
                    expectedAvailableBalance - expectedProtocolFeePaid :
                    expectedAvailableBalance;
            }
        } else {
            // Ensure that zero test logs were created.
            require(testLogs.length == 0, "Incorrect number of test logs in batchFillOrders test");
        }
    }

    /// @dev Tests the `fillOrder` function's payment of protocol fees.
    /// @param testProtocolFees The TestProtocolFees that should be tested against.
    /// @param protocolFeeMultiplier The protocol fee multiplier that should be registered
    ///        in the test suite before executing `fillOrder`.
    /// @param shouldSetProtocolFeeCollector A boolean value indicating whether or not this contract
    ///        should be registered as the `protocolFeeCollector`.
    function testFillOrderProtocolFees(
        TestProtocolFees testProtocolFees,
        uint256 protocolFeeMultiplier,
        bool shouldSetProtocolFeeCollector
    )
        external
        payable
        handleState(testProtocolFees, protocolFeeMultiplier, shouldSetProtocolFeeCollector)
    {
        // Create empty values for the takerAssetFilledAmount and the signature since these values don't
        // matter for this test.
        uint256 takerAssetFilledAmount = 0;
        bytes memory signature = new bytes(0);

        // Construct an of order with distinguishing information.
        LibOrder.Order memory order = createOrder(makerAddress1);

        // Forward all of the value sent to the contract to `fillOrder()`.
        testProtocolFees.fillOrder.value(msg.value)(order, takerAssetFilledAmount, signature);

        // If the `protocolFeeCollector` was set, ensure that the protocol fee was paid correctly.
        // Otherwise, the protocol fee should not have been paid.
        if (shouldSetProtocolFeeCollector) {
            // Ensure that only one test log was created by the call to `fillOrder()`.
            require(testLogs.length == 1, "Incorrect number of test logs in fillOrder test");

            // Calculate the expected protocol fee.
            uint256 expectedProtocolFeePaid = tx.gasprice.safeMul(protocolFeeMultiplier);

            // Verify that the test log that was created is correct.
            verifyTestLog(
                testLogs[0],
                msg.value,                // expectedAvailableBalance
                makerAddress1,            // expectedMakerAddress
                address(this),            // expectedPayerAddress
                expectedProtocolFeePaid   // expectedProtocolFeePaid
            );
        } else {
            // Ensure that zero test logs were created.
            require(testLogs.length == 0, "Incorrect number of test logs in fillOrder test");
        }
    }

    /// @dev Tests the `matchOrders` function's payment of protocol fees.
    /// @param testProtocolFees The TestProtocolFees that should be tested against.
    /// @param protocolFeeMultiplier The protocol fee multiplier that should be registered
    ///        in the test suite before executing `matchOrders`.
    /// @param shouldSetProtocolFeeCollector A boolean value indicating whether or not this contract
    ///        should be registered as the `protocolFeeCollector`.
    function testMatchOrdersProtocolFees(
        TestProtocolFees testProtocolFees,
        uint256 protocolFeeMultiplier,
        bool shouldSetProtocolFeeCollector
    )
        external
        payable
        handleState(testProtocolFees, protocolFeeMultiplier, shouldSetProtocolFeeCollector)
    {
        // Create two empty signatures since signatures are not used in this test.
        bytes memory leftSignature = new bytes(0);
        bytes memory rightSignature = new bytes(0);

        // Construct a distinguished left order.
        LibOrder.Order memory leftOrder = createOrder(makerAddress1);

        // Construct a distinguished right order.
        LibOrder.Order memory rightOrder = createOrder(makerAddress2);

       // Forward all of the value sent to the contract to `matchOrders()`.
       testProtocolFees.matchOrders.value(msg.value)(leftOrder, rightOrder, leftSignature, rightSignature);

        // If the `protocolFeeCollector` was set, ensure that the protocol fee was paid correctly.
        // Otherwise, the protocol fee should not have been paid.
        if (shouldSetProtocolFeeCollector) {
            // Ensure that only one test log was created by the call to `fillOrder()`.
            require(testLogs.length == 2, "Incorrect number of test logs in matchOrders test");

            // Calculate the expected protocol fee.
            uint256 expectedProtocolFeePaid = tx.gasprice.safeMul(protocolFeeMultiplier);

            // Set the expected available balance for the first log.
            uint256 expectedAvailableBalance = msg.value;

            // Verify that the first test log that was created is correct.
            verifyTestLog(
                testLogs[0],
                expectedAvailableBalance,  // expectedAvailableBalance
                makerAddress1,             // expectedMakerAddress
                address(this),             // expectedPayerAddress
                expectedProtocolFeePaid    // expectedProtocolFeePaid
            );

            // Set the expected available balance for the second log.
            expectedAvailableBalance = expectedAvailableBalance >= expectedProtocolFeePaid ?
                expectedAvailableBalance - expectedProtocolFeePaid :
                expectedAvailableBalance;

            // Verify that the second test log that was created is correct.
            verifyTestLog(
                testLogs[1],
                expectedAvailableBalance, // expectedAvailableBalance
                makerAddress2,             // expectedMakerAddress
                address(this),             // expectedPayerAddress
                expectedProtocolFeePaid    // expectedProtocolFeePaid
            );
        } else {
            // Ensure that zero test logs were created.
            require(testLogs.length == 0, "Incorrect number of test logs in matchOrders test");
        }
    }

    /* Verification Functions */

    /// @dev Verifies a test log against expected values.
    /// @param expectedAvailableBalance The balance that should be available when this call is made.
    ///                         This is important especially for tests on wrapper functions.
    /// @param expectedMakerAddress The expected maker address to be recorded in `payProtocolFee`.
    /// @param expectedPayerAddress The expected payer address to be recorded in `payProtocolFee`.
    /// @param expectedProtocolFeePaid The expected protocol fee paidto be recorded in `payProtocolFee`.
    function verifyTestLog(
        TestLog memory log,
        uint256 expectedAvailableBalance,
        address expectedMakerAddress,
        address expectedPayerAddress,
        uint256 expectedProtocolFeePaid
    )
        internal
        pure
    {
        // If the expected available balance was sufficient to pay the protocol fee, the protocol fee
        // should have been paid in ether. Otherwise, no ether should be sent to pay the protocol fee.
        if (expectedAvailableBalance >= expectedProtocolFeePaid) {
            // Ensure that the protocol fee was paid in ether.
            require(
                log.loggedValue == expectedProtocolFeePaid,
                "Incorrect eth was received during fillOrder test when adequate ETH was sent"
            );
        } else {
            // Ensure that the protocol fee was not paid in ether.
            require(
                log.loggedValue == 0,
                "Incorrect eth was received during fillOrder test when inadequate ETH was sent"
            );
        }

        // Ensure that the correct data was logged.
        require(log.loggedMaker == expectedMakerAddress, "Incorrect maker address was logged");
        require(log.loggedPayer == expectedPayerAddress, "Incorrect taker address was logged");
        require(log.loggedProtocolFeePaid == expectedProtocolFeePaid, "Incorrect protocol fee was logged");
    }

    /* Testing Convenience Functions */

    /// @dev Sets up state that is necessary for tests and then cleans up the state that was written
    ///      to so that test cases can be thought of as atomic.
    /// @param testProtocolFees The TestProtocolFees contract that is being used during testing.
    /// @param protocolFeeMultiplier The protocolFeeMultiplier of this test case.
    /// @param shouldSetProtocolFeeCollector A boolean value that indicates whether or not this address
    ///        should be made the protocol fee collector.
    modifier handleState(
        TestProtocolFees testProtocolFees,
        uint256 protocolFeeMultiplier,
        bool shouldSetProtocolFeeCollector
    )
    {
        // If necessary, set the protocol fee collector field in the exchange.
        if (shouldSetProtocolFeeCollector) {
            testProtocolFees.setProtocolFeeCollector(address(this));
        }
        // Set the protocol fee multiplier in the exchange.
        testProtocolFees.setProtocolFeeMultiplier(protocolFeeMultiplier);

        // Execute the test.
        _;
    }

    /// @dev Constructs an order with a specified maker address.
    /// @param makerAddress The maker address of the order.
    function createOrder(address makerAddress)
        internal
        pure
        returns (LibOrder.Order memory order)
    {
        order.makerAddress = makerAddress;
        order.makerAssetAmount = 1; // This is 1 so that it doesn't trigger a `DivionByZero()` error.
        order.takerAssetAmount = 1; // This is 1 so that it doesn't trigger a `DivionByZero()` error.
    }

    /* Protocol Fee Receiver and Fallback */

    /// @dev Receives payments of protocol fees from a TestProtocolFees contract
    ///      and records the data provided and the message value sent.
    /// @param makerAddress The maker address that should be recorded.
    /// @param payerAddress The payer address that should be recorded.
    /// @param protocolFeePaid The protocol fee that should be recorded.
    function payProtocolFee(
        address makerAddress,
        address payerAddress,
        uint256 protocolFeePaid
    )
        external
        payable
    {
        // Push the collected data into `testLogs`.
        testLogs.push(TestLog({
            loggedMaker: makerAddress,
            loggedPayer: payerAddress,
            loggedProtocolFeePaid: protocolFeePaid,
            loggedValue: msg.value
        }));
    }

    /// @dev A payable fallback function that makes this contract "payable". This is necessary to allow
    ///      this contract to gracefully handle refunds from TestProtocolFees contracts.
    function ()
        external
        payable
    {}
}
