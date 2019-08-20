import {
    blockchainTests,
    constants,
    describe,
    expect,
    getLatestBlockTimestampAsync,
    hexRandom,
    LogDecoder,
} from '@0x/contracts-test-utils';
import { ExchangeRevertErrors, transactionHashUtils } from '@0x/order-utils';
import { EIP712DomainWithDefaultSchema, ZeroExTransaction } from '@0x/types';
import { AbiEncoder, BigNumber, StringRevertError } from '@0x/utils';
import { LogWithDecodedArgs } from 'ethereum-types';
import * as _ from 'lodash';

import { artifacts, TestTransactionsContract, TestTransactionsTransactionExecutionEventArgs } from '../src';

blockchainTests.resets.only('Transaction Unit Tests', ({ provider, web3Wrapper, txDefaults }) => {
    let transactionsContract: TestTransactionsContract;
    let accounts: string[];
    let domain: EIP712DomainWithDefaultSchema;
    let logDecoder: LogDecoder;

    const randomSignature = () => hexRandom(66);

    const EMPTY_ZERO_EX_TRANSACTION = {
        salt: constants.ZERO_AMOUNT,
        expirationTimeSeconds: constants.ZERO_AMOUNT,
        signerAddress: constants.NULL_ADDRESS,
        data: constants.NULL_BYTES,
        domain: {
            verifyingContractAddress: constants.NULL_ADDRESS,
            chainId: 0,
        },
    };

    before(async () => {
        // A list of available addresses to use during testing.
        accounts = await web3Wrapper.getAvailableAddressesAsync();

        // Insantiate a LogDecoder instance
        logDecoder = new LogDecoder(web3Wrapper, artifacts);

        // Deploy the transaction test contract.
        transactionsContract = await TestTransactionsContract.deployFrom0xArtifactAsync(
            artifacts.TestTransactions,
            provider,
            txDefaults,
            {},
        );

        // Set the default domain.
        domain = {
            verifyingContractAddress: transactionsContract.address,
            chainId: 1337,
        };
    });

    /**
     * Generates calldata for a call to `executable()` in the `TestTransactions` contract.
     */
    function getExecutableCallData(shouldSucceed: boolean, callData: string, returnData: string): string {
        return (transactionsContract as any).executable.getABIEncodedTransactionData(
            shouldSucceed,
            callData,
            returnData,
        );
    }

    describe('batchExecuteTransaction', () => {
        it('should revert if the only call to executeTransaction fails', async () => {
            // Create an expired transaction that will fail when used to call `batchExecuteTransactions()`.
            const currentTimestamp = await getLatestBlockTimestampAsync();
            const transaction = {
                ...EMPTY_ZERO_EX_TRANSACTION,
                expirationTimeSeconds: new BigNumber(currentTimestamp).minus(10), // Set the expiration time to before the current timestamp
                data: getExecutableCallData(false, constants.NULL_BYTES, constants.NULL_BYTES),
                domain,
            };
            const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);

            // We expect a `TransactionError` to be returned because that is the error that will be triggered in the call to
            // `executeTransaction`.
            const expectedError = new ExchangeRevertErrors.TransactionError(
                ExchangeRevertErrors.TransactionErrorCode.Expired,
                transactionHash,
            );

            // Call the `batchExecuteTransactions()` function and ensure that it reverts with the expected revert error.
            const tx = transactionsContract.batchExecuteTransactions.sendTransactionAsync(
                [transaction],
                [randomSignature()],
            );
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert if the second call to executeTransaction fails', async () => {
            // Create a transaction that will succeed when used to call `batchExecuteTransactions()`.
            const currentTimestamp = await getLatestBlockTimestampAsync();
            const transaction1 = {
                ...EMPTY_ZERO_EX_TRANSACTION,
                data: getExecutableCallData(true, constants.NULL_BYTES, constants.NULL_BYTES), // This call should succeed
                expirationTimeSeconds: new BigNumber(currentTimestamp).plus(10),
                domain,
            };

            // Create a transaction that will fail when used to call `batchExecuteTransactions()` because the call to executable will fail.
            const transaction2 = {
                ...EMPTY_ZERO_EX_TRANSACTION,
                data: getExecutableCallData(false, constants.NULL_BYTES, constants.NULL_BYTES), // This call should fail
                expirationTimeSeconds: new BigNumber(currentTimestamp).plus(10),
                domain,
            };
            const transactionHash = transactionHashUtils.getTransactionHashHex(transaction2);

            // Create the StringRevertError that reflects the returndata that will be returned by the failed transaction.
            const executableError = new StringRevertError('EXECUTABLE_FAILED');
            const expectedError = new ExchangeRevertErrors.TransactionExecutionError(
                transactionHash,
                executableError.encode(),
            );

            // Call the `batchExecuteTransactions()` function and ensure that it reverts with the expected revert error.
            const tx = transactionsContract.batchExecuteTransactions.sendTransactionAsync(
                [transaction1, transaction2],
                [randomSignature(), randomSignature()],
            );
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert if the first call to executeTransaction fails', async () => {
            // Create a transaction that will fail when used to call `batchExecuteTransactions()` because the call to executable will fail.
            const currentTimestamp = await getLatestBlockTimestampAsync();
            const transaction1 = {
                ...EMPTY_ZERO_EX_TRANSACTION,
                data: getExecutableCallData(false, constants.NULL_BYTES, constants.NULL_BYTES), // This call should fail
                expirationTimeSeconds: new BigNumber(currentTimestamp).plus(10),
                domain,
            };

            // Create a transaction that will succeed when used to call `batchExecuteTransactions()`.
            const transaction2 = {
                ...EMPTY_ZERO_EX_TRANSACTION,
                data: getExecutableCallData(true, constants.NULL_BYTES, constants.NULL_BYTES),
                expirationTimeSeconds: new BigNumber(currentTimestamp).plus(10),
                domain,
            };
            const transactionHash = transactionHashUtils.getTransactionHashHex(transaction1);

            // Create the StringRevertError that reflects the returndata that will be returned by the failed transaction.
            const executableError = new StringRevertError('EXECUTABLE_FAILED');
            const expectedError = new ExchangeRevertErrors.TransactionExecutionError(
                transactionHash,
                executableError.encode(),
            );

            // Call the `batchExecuteTransactions()` function and ensure that it reverts with the expected revert error.
            const tx = transactionsContract.batchExecuteTransactions.sendTransactionAsync(
                [transaction1, transaction2],
                [randomSignature(), randomSignature()],
            );
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert if the same transaction is executed twice in a batch', async () => {
            // Create a transaction that will succeed when used to call `batchExecuteTransactions()`.
            const currentTimestamp = await getLatestBlockTimestampAsync();
            const transaction1 = {
                ...EMPTY_ZERO_EX_TRANSACTION,
                expirationTimeSeconds: new BigNumber(currentTimestamp).plus(10),
                signerAddress: accounts[1],
                data: getExecutableCallData(true, constants.NULL_BYTES, constants.NULL_BYTES),
                domain,
            };

            // Duplicate the first transaction. This should cause the call to `batchExecuteTransactions()` to fail
            // because this transaction will have the same order hash as transaction1.
            const transaction2 = {
                ...EMPTY_ZERO_EX_TRANSACTION,
                expirationTimeSeconds: new BigNumber(currentTimestamp).plus(10),
                signerAddress: accounts[1],
                data: getExecutableCallData(true, constants.NULL_BYTES, constants.NULL_BYTES),
                domain,
            };
            const transactionHash2 = transactionHashUtils.getTransactionHashHex(transaction2);

            // Call the `batchExecuteTransactions()` function and ensure that it reverts with the expected revert error.
            const expectedError = new ExchangeRevertErrors.TransactionError(
                ExchangeRevertErrors.TransactionErrorCode.AlreadyExecuted,
                transactionHash2,
            );
            const tx = transactionsContract.batchExecuteTransactions.sendTransactionAsync(
                [transaction1, transaction2],
                [randomSignature(), randomSignature()],
                {
                    from: accounts[0],
                },
            );
            return expect(tx).to.revertWith(expectedError);
        });

        it('should succeed if the only call to executeTransaction succeeds', async () => {
            const currentTimestamp = await getLatestBlockTimestampAsync();

            // Create a transaction that will succeed when used to call `batchExecuteTransactions()`.
            const transaction = {
                ...EMPTY_ZERO_EX_TRANSACTION,
                expirationTimeSeconds: new BigNumber(currentTimestamp).plus(10),
                signerAddress: accounts[1],
                data: getExecutableCallData(true, constants.NULL_BYTES, '0xdeadbeef'),
                domain,
            };
            const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);
            const validSignature = randomSignature();

            // Verify that the returndata of the transaction is 0xDEADBEEF
            const result = await transactionsContract.batchExecuteTransactions.callAsync(
                [transaction],
                [randomSignature()],
                {
                    from: accounts[0],
                },
            );

            expect(result.length).to.be.eq(1);

            // Create an abiEncoder for bytes. This will be used to decode the result and encode what
            // is expected.
            const abiEncoder = AbiEncoder.create('bytes');

            // Ensure that the result contains the abi-encoded bytes "0xdeadbeef"
            const encodedDeadbeef = abiEncoder.encode('0xdeadbeef');
            expect(
                result[0] ===
                    '0x0000000000000000000000000000000000000000000000000000000000000020'.concat(
                        encodedDeadbeef.slice(2, encodedDeadbeef.length),
                    ),
            ).to.be.true();

            // Verify that the logs returned from the call are correct.
            const receipt = await logDecoder.getTxWithDecodedLogsAsync(
                await transactionsContract.batchExecuteTransactions.sendTransactionAsync(
                    [transaction],
                    [validSignature],
                ),
            );

            // Ensure that the correct number of events were logged.
            const logs = receipt.logs as Array<LogWithDecodedArgs<TestTransactionsTransactionExecutionEventArgs>>;
            expect(logs.length).to.be.eq(2);

            // Ensure that the correct events were logged.
            expect(logs[0].event).to.be.eq('ExecutableCalled');
            expect(logs[0].args.data).to.be.eq(constants.NULL_BYTES);
            expect(logs[0].args.returnData).to.be.eq('0xdeadbeef');
            expect(logs[1].event).to.be.eq('TransactionExecution');
            expect(logs[1].args.transactionHash).to.eq(transactionHash);
        });

        it('should succeed if the both calls to executeTransaction succeed', async () => {
            const currentTimestamp = await getLatestBlockTimestampAsync();

            // Create two transactions that will succeed when used to call `batchExecuteTransactions()`.
            const transaction1 = {
                ...EMPTY_ZERO_EX_TRANSACTION,
                expirationTimeSeconds: new BigNumber(currentTimestamp).plus(10),
                signerAddress: accounts[0], // This is different than the account that will be used to send.
                data: getExecutableCallData(true, constants.NULL_BYTES, '0xdeadbeef'),
                domain,
            };
            const transaction2 = {
                ...EMPTY_ZERO_EX_TRANSACTION,
                expirationTimeSeconds: new BigNumber(currentTimestamp).plus(10),
                signerAddress: accounts[1], // Different than transaction1's signer address
                data: getExecutableCallData(true, constants.NULL_BYTES, '0xbeefdead'),
                domain,
            };
            const transactionHash1 = transactionHashUtils.getTransactionHashHex(transaction1);
            const transactionHash2 = transactionHashUtils.getTransactionHashHex(transaction2);

            // Verify that the returndata of the transaction is 0xDEADBEEF
            const result = await transactionsContract.batchExecuteTransactions.callAsync(
                [transaction1, transaction2],
                [randomSignature(), randomSignature()],
                {
                    from: accounts[0],
                },
            );

            // Create an abiEncoder for bytes. This will be used to decode the result and encode what
            // is expected.
            const abiEncoder = AbiEncoder.create('bytes');

            // Ensure that the result contains the abi-encoded bytes "0xdeadbeef"
            const encodedDeadbeef = abiEncoder.encode('0xdeadbeef');
            expect(result.length).to.be.eq(2);
            expect(
                result[0] ===
                    '0x0000000000000000000000000000000000000000000000000000000000000020'.concat(
                        encodedDeadbeef.slice(2, encodedDeadbeef.length),
                    ),
            ).to.be.true();

            // Ensure that the result contains the abi-encoded bytes "0xdeadbeef"
            const encodedBeefdead = abiEncoder.encode('0xbeefdead');
            expect(result.length).to.be.eq(2);
            expect(
                result[1] ===
                    '0x0000000000000000000000000000000000000000000000000000000000000020'.concat(
                        encodedBeefdead.slice(2, encodedBeefdead.length),
                    ),
            ).to.be.true();

            // Verify that the logs returned from the call are correct.
            const receipt = await logDecoder.getTxWithDecodedLogsAsync(
                await transactionsContract.batchExecuteTransactions.sendTransactionAsync(
                    [transaction1, transaction2],
                    [randomSignature(), randomSignature()],
                    {
                        from: accounts[0],
                    },
                ),
            );

            // Verify that the correct number of events were logged.
            const logs = receipt.logs as Array<LogWithDecodedArgs<TestTransactionsTransactionExecutionEventArgs>>;
            expect(logs.length).to.be.eq(4);

            // Ensure that the correct events were logged.
            expect(logs[0].event).to.be.eq('ExecutableCalled');
            expect(logs[0].args.data).to.be.eq(constants.NULL_BYTES);
            expect(logs[0].args.returnData).to.be.eq('0xdeadbeef');
            expect(logs[1].event).to.be.eq('TransactionExecution');
            expect(logs[1].args.transactionHash).to.eq(transactionHash1);
            expect(logs[2].event).to.be.eq('ExecutableCalled');
            expect(logs[2].args.data).to.be.eq(constants.NULL_BYTES);
            expect(logs[2].args.returnData).to.be.eq('0xbeefdead');
            expect(logs[3].event).to.be.eq('TransactionExecution');
            expect(logs[3].args.transactionHash).to.eq(transactionHash2);
        });
    });

    describe('executeTransaction', () => {
        function getExecuteTransactionCallData(transaction: ZeroExTransaction, signature: string): string {
            return (transactionsContract as any).executeTransaction.getABIEncodedTransactionData(
                transaction,
                signature,
            );
        }

        it('should revert if the current time is past the expiration time', async () => {
            const currentTimestamp = await getLatestBlockTimestampAsync();
            const transaction = {
                ...EMPTY_ZERO_EX_TRANSACTION,
                expirationTimeSeconds: new BigNumber(currentTimestamp).minus(10), // Set the expiration time to before the current timestamp
                domain,
            };
            const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);
            const expectedError = new ExchangeRevertErrors.TransactionError(
                ExchangeRevertErrors.TransactionErrorCode.Expired,
                transactionHash,
            );
            const tx = transactionsContract.executeTransaction.sendTransactionAsync(transaction, randomSignature());
            return expect(tx).to.revertWith(expectedError);
        });

        // FIXME - This should be unskipped when the contracts have been updated to fix this problem.
        it.skip('should revert if reentrancy occurs in the middle of an executeTransaction call and msg.sender == signer for both calls', async () => {
            const validSignature = randomSignature();

            const currentTimestamp = await getLatestBlockTimestampAsync();
            const transaction1 = {
                ...EMPTY_ZERO_EX_TRANSACTION,
                expirationTimeSeconds: new BigNumber(currentTimestamp).plus(10),
                data: getExecutableCallData(true, constants.NULL_BYTES, constants.NULL_BYTES), // This should never get called
                signerAddress: accounts[0],
                domain,
            };
            const transactionHash1 = transactionHashUtils.getTransactionHashHex(transaction1);

            const callData = getExecutableCallData(
                true,
                getExecuteTransactionCallData(transaction1, validSignature),
                '0xdeadbeef',
            );

            const transaction2 = {
                ...EMPTY_ZERO_EX_TRANSACTION,
                expirationTimeSeconds: new BigNumber(currentTimestamp).plus(10),
                data: callData,
                signerAddress: accounts[0],
                domain,
            };
            const transactionHash2 = transactionHashUtils.getTransactionHashHex(transaction2);
            const abiEncoder = AbiEncoder.createMethod('TransactionError', ['uint8', 'bytes32']);
            const errorData = abiEncoder.encode([
                ExchangeRevertErrors.TransactionErrorCode.NoReentrancy,
                transactionHash1,
            ]);

            const expectedError = new ExchangeRevertErrors.TransactionExecutionError(transactionHash2, errorData);
            const tx = transactionsContract.executeTransaction.sendTransactionAsync(transaction2, validSignature, {
                from: accounts[0],
            });
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert if reentrancy occurs in the middle of an executeTransaction call and msg.sender != signer for both calls', async () => {
            const validSignature = randomSignature();

            const currentTimestamp = await getLatestBlockTimestampAsync();
            const transaction1 = {
                ...EMPTY_ZERO_EX_TRANSACTION,
                expirationTimeSeconds: new BigNumber(currentTimestamp).plus(10),
                data: getExecutableCallData(true, constants.NULL_BYTES, constants.NULL_BYTES), // This should never get called
                signerAddress: accounts[0],
                domain,
            };
            const transactionHash1 = transactionHashUtils.getTransactionHashHex(transaction1);

            const callData = getExecutableCallData(
                true,
                getExecuteTransactionCallData(transaction1, validSignature),
                '0xdeadbeef',
            );

            const transaction2 = {
                ...EMPTY_ZERO_EX_TRANSACTION,
                expirationTimeSeconds: new BigNumber(currentTimestamp).plus(10),
                data: callData,
                signerAddress: accounts[0],
                domain,
            };
            const transactionHash2 = transactionHashUtils.getTransactionHashHex(transaction2);
            const abiEncoder = AbiEncoder.createMethod('TransactionError', ['uint8', 'bytes32']);
            const errorData = abiEncoder.encode([
                ExchangeRevertErrors.TransactionErrorCode.NoReentrancy,
                transactionHash1,
            ]);

            const expectedError = new ExchangeRevertErrors.TransactionExecutionError(transactionHash2, errorData);
            const tx = transactionsContract.executeTransaction.sendTransactionAsync(transaction2, validSignature, {
                from: accounts[1], // Different then the signing addresses
            });
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert if reentrancy occurs in the middle of an executeTransaction call and msg.sender != signer and then msg.sender == sender', async () => {
            const validSignature = randomSignature();

            const currentTimestamp = await getLatestBlockTimestampAsync();
            const transaction1 = {
                ...EMPTY_ZERO_EX_TRANSACTION,
                expirationTimeSeconds: new BigNumber(currentTimestamp).plus(10),
                data: getExecutableCallData(true, constants.NULL_BYTES, constants.NULL_BYTES), // This should never get called
                signerAddress: accounts[1],
                domain,
            };
            const transactionHash1 = transactionHashUtils.getTransactionHashHex(transaction1);

            const callData = getExecutableCallData(
                true,
                getExecuteTransactionCallData(transaction1, validSignature),
                '0xdeadbeef',
            );

            const transaction2 = {
                ...EMPTY_ZERO_EX_TRANSACTION,
                expirationTimeSeconds: new BigNumber(currentTimestamp).plus(10),
                data: callData,
                signerAddress: accounts[0],
                domain,
            };
            const transactionHash2 = transactionHashUtils.getTransactionHashHex(transaction2);
            const abiEncoder = AbiEncoder.createMethod('TransactionError', ['uint8', 'bytes32']);
            const errorData = abiEncoder.encode([
                ExchangeRevertErrors.TransactionErrorCode.NoReentrancy,
                transactionHash1,
            ]);

            const expectedError = new ExchangeRevertErrors.TransactionExecutionError(transactionHash2, errorData);
            const tx = transactionsContract.executeTransaction.sendTransactionAsync(transaction2, validSignature, {
                from: accounts[1], // Different then the signing addresses
            });
            return expect(tx).to.revertWith(expectedError);
        });

        // FIXME - This should be unskipped when the contracts have been updated to fix this problem.
        it.skip('should revert if reentrancy occurs in the middle of an executeTransaction call and msg.sender == signer and then msg.sender != sender', async () => {
            const validSignature = randomSignature();

            const currentTimestamp = await getLatestBlockTimestampAsync();
            const transaction1 = {
                ...EMPTY_ZERO_EX_TRANSACTION,
                expirationTimeSeconds: new BigNumber(currentTimestamp).plus(10),
                data: getExecutableCallData(true, constants.NULL_BYTES, constants.NULL_BYTES), // This should never get called
                signerAddress: accounts[0],
                domain,
            };
            const transactionHash1 = transactionHashUtils.getTransactionHashHex(transaction1);

            const callData = getExecutableCallData(
                true,
                getExecuteTransactionCallData(transaction1, validSignature),
                '0xdeadbeef',
            );

            const transaction2 = {
                ...EMPTY_ZERO_EX_TRANSACTION,
                expirationTimeSeconds: new BigNumber(currentTimestamp).plus(10),
                data: callData,
                signerAddress: accounts[1],
                domain,
            };
            const transactionHash2 = transactionHashUtils.getTransactionHashHex(transaction2);
            const abiEncoder = AbiEncoder.createMethod('TransactionError', ['uint8', 'bytes32']);
            const errorData = abiEncoder.encode([
                ExchangeRevertErrors.TransactionErrorCode.NoReentrancy,
                transactionHash1,
            ]);

            const expectedError = new ExchangeRevertErrors.TransactionExecutionError(transactionHash2, errorData);
            const tx = transactionsContract.executeTransaction.sendTransactionAsync(transaction2, validSignature, {
                from: accounts[1], // Different then the signing addresses
            });
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert if the transaction has been executed previously', async () => {
            const validSignature = randomSignature();
            const currentTimestamp = await getLatestBlockTimestampAsync();
            const transaction = {
                ...EMPTY_ZERO_EX_TRANSACTION,
                expirationTimeSeconds: new BigNumber(currentTimestamp).plus(10),
                data: getExecutableCallData(true, constants.NULL_BYTES, constants.NULL_BYTES),
                domain,
            };
            const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);

            // Use the transaction in execute transaction.
            await expect(
                transactionsContract.executeTransaction.sendTransactionAsync(transaction, validSignature),
            ).to.be.fulfilled('');

            // Use the same transaction to make another call
            const expectedError = new ExchangeRevertErrors.TransactionError(
                ExchangeRevertErrors.TransactionErrorCode.AlreadyExecuted,
                transactionHash,
            );
            const tx = transactionsContract.executeTransaction.sendTransactionAsync(transaction, validSignature);
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert if the signer != msg.sender and the signature is not valid', async () => {
            const currentTimestamp = await getLatestBlockTimestampAsync();
            const transaction = {
                ...EMPTY_ZERO_EX_TRANSACTION,
                expirationTimeSeconds: new BigNumber(currentTimestamp).plus(10),
                signerAddress: accounts[1], // This is different than the account that will be used to send.
                domain,
            };
            const signature = '0x0000'; // This is the invalid signature
            const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);
            const expectedError = new ExchangeRevertErrors.TransactionSignatureError(
                transactionHash,
                accounts[1],
                signature,
            );
            const tx = transactionsContract.executeTransaction.sendTransactionAsync(transaction, signature, {
                from: accounts[0],
            });
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert if the signer == msg.sender but the delegatecall fails', async () => {
            // This calldata is encoded to fail when it hits the executable function.
            const callData = getExecutableCallData(false, constants.NULL_BYTES, constants.NULL_BYTES);
            const currentTimestamp = await getLatestBlockTimestampAsync();
            const transaction = {
                ...EMPTY_ZERO_EX_TRANSACTION,
                expirationTimeSeconds: new BigNumber(currentTimestamp).plus(10),
                signerAddress: accounts[1],
                data: callData,
                domain,
            };
            const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);
            const executableError = new StringRevertError('EXECUTABLE_FAILED');
            const expectedError = new ExchangeRevertErrors.TransactionExecutionError(
                transactionHash,
                executableError.encode(),
            );
            const tx = transactionsContract.executeTransaction.sendTransactionAsync(transaction, randomSignature(), {
                from: accounts[1],
            });
            return expect(tx).to.revertWith(expectedError);
        });

        it('should revert if the signer != msg.sender and the signature is valid but the delegatecall fails', async () => {
            // This calldata is encoded to fail when it hits the executable function.
            const callData = getExecutableCallData(false, constants.NULL_BYTES, constants.NULL_BYTES);
            const currentTimestamp = await getLatestBlockTimestampAsync();
            const transaction = {
                ...EMPTY_ZERO_EX_TRANSACTION,
                expirationTimeSeconds: new BigNumber(currentTimestamp).plus(10),
                signerAddress: accounts[1], // This is different than the account that will be used to send.
                data: callData,
                domain,
            };
            const validSignature = randomSignature(); // Valid because length != 2
            const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);
            const executableError = new StringRevertError('EXECUTABLE_FAILED');
            const expectedError = new ExchangeRevertErrors.TransactionExecutionError(
                transactionHash,
                executableError.encode(),
            );
            const tx = transactionsContract.executeTransaction.sendTransactionAsync(transaction, validSignature, {
                from: accounts[0],
            });
            return expect(tx).to.revertWith(expectedError);
        });

        it('should succeed with the correct return hash and event emitted', async () => {
            // This calldata is encoded to succeed when it hits the executable function.
            const callData = getExecutableCallData(true, constants.NULL_BYTES, '0xdeadbeef');
            const currentTimestamp = await getLatestBlockTimestampAsync();
            const validSignature = randomSignature(); // Valid because length != 2
            const transaction = {
                ...EMPTY_ZERO_EX_TRANSACTION,
                expirationTimeSeconds: new BigNumber(currentTimestamp).plus(10),
                signerAddress: accounts[1], // This is different than the account that will be used to send.
                data: callData,
                domain,
            };
            const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);

            // Verify that the returndata of the transaction is 0xDEADBEEF
            const result = await transactionsContract.executeTransaction.callAsync(transaction, validSignature, {
                from: accounts[0],
            });

            // Create an abiEncoder for bytes. This will be used to decode the result and encode what
            // is expected.
            const abiEncoder = AbiEncoder.create('bytes');

            // Ensure that the result contains the abi-encoded bytes "0xdeadbeef"
            const encodedDeadbeef = abiEncoder.encode('0xdeadbeef');
            expect(
                result ===
                    '0x0000000000000000000000000000000000000000000000000000000000000020'.concat(
                        encodedDeadbeef.slice(2, encodedDeadbeef.length),
                    ),
            ).to.be.true();

            // Verify that the logs returned from the call are correct.
            const receipt = await logDecoder.getTxWithDecodedLogsAsync(
                await transactionsContract.executeTransaction.sendTransactionAsync(transaction, validSignature, {
                    from: accounts[0],
                }),
            );

            // Ensure that the correct number of events were logged.
            const logs = receipt.logs as Array<LogWithDecodedArgs<TestTransactionsTransactionExecutionEventArgs>>;
            expect(logs.length).to.be.eq(2);

            // Ensure that the correct events were logged.
            expect(logs[0].event).to.be.eq('ExecutableCalled');
            expect(logs[0].args.data).to.be.eq(constants.NULL_BYTES);
            expect(logs[0].args.returnData).to.be.eq('0xdeadbeef');
            expect(logs[1].event).to.be.eq('TransactionExecution');
            expect(logs[1].args.transactionHash).to.eq(transactionHash);
        });
    });

    describe('getCurrentContext', () => {
        it('should return the sender address when there is not a saved context address', async () => {
            const currentContextAddress = await transactionsContract.getCurrentContextAddress.callAsync({
                from: accounts[0],
            });
            expect(currentContextAddress).to.be.eq(accounts[0]);
        });

        it('should return the sender address when there is a saved context address', async () => {
            // Set the current context address to the taker address
            await transactionsContract.setCurrentContextAddress.sendTransactionAsync(accounts[1]);

            // Ensure that the queried current context address is the same as the address that was set.
            const currentContextAddress = await transactionsContract.getCurrentContextAddress.callAsync({
                from: accounts[0],
            });
            expect(currentContextAddress).to.be.eq(accounts[1]);
        });
    });
});
// tslint:disable-line:max-file-line-count
