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

blockchainTests.resets('Transaction Unit Tests', ({ provider, web3Wrapper, txDefaults }) => {
    let transactionsContract: TestTransactionsContract;
    let accounts: string[];
    let domain: EIP712DomainWithDefaultSchema;
    let logDecoder: LogDecoder;

    const randomSignature = () => hexRandom(66);

    const EMPTY_ZERO_EX_TRANSACTION = {
        salt: constants.ZERO_AMOUNT,
        expirationTimeSeconds: constants.ZERO_AMOUNT,
        gasPrice: constants.ZERO_AMOUNT,
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

    interface GenerateZeroExTransactionParams {
        salt?: BigNumber;
        expirationTimeSeconds?: BigNumber;
        gasPrice?: BigNumber;
        signerAddress?: string;
        data?: string;
        domain?: EIP712DomainWithDefaultSchema;
        shouldSucceed?: boolean;
        callData?: string;
        returnData?: string;
    }

    async function generateZeroExTransactionAsync(
        opts: GenerateZeroExTransactionParams = {},
    ): Promise<ZeroExTransaction> {
        const shouldSucceed = opts.shouldSucceed === undefined ? true : opts.shouldSucceed;
        const callData = opts.callData === undefined ? constants.NULL_BYTES : opts.callData;
        const returnData = opts.returnData === undefined ? constants.NULL_BYTES : opts.returnData;
        const data = opts.data === undefined ? getExecutableCallData(shouldSucceed, callData, returnData) : opts.data;
        const gasPrice = opts.gasPrice === undefined ? new BigNumber(constants.DEFAULT_GAS_PRICE) : opts.gasPrice;
        const _domain = opts.domain === undefined ? domain : opts.domain;
        const expirationTimeSeconds =
            opts.expirationTimeSeconds === undefined
                ? new BigNumber(await getLatestBlockTimestampAsync()).plus(10)
                : opts.expirationTimeSeconds;
        const transaction = {
            ...EMPTY_ZERO_EX_TRANSACTION,
            ...opts,
            data,
            expirationTimeSeconds,
            domain: _domain,
            gasPrice,
        };
        return transaction;
    }

    describe('batchExecuteTransaction', () => {
        it('should revert if the only call to executeTransaction fails', async () => {
            // Create an expired transaction that will fail when used to call `batchExecuteTransactions()`.
            const transaction = await generateZeroExTransactionAsync({ shouldSucceed: false });
            const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);

            // Create the StringRevertError that reflects the returndata that will be returned by the failed transaction.
            const executableError = new StringRevertError('EXECUTABLE_FAILED');
            const expectedError = new ExchangeRevertErrors.TransactionExecutionError(
                transactionHash,
                executableError.encode(),
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
            const transaction1 = await generateZeroExTransactionAsync();

            // Create a transaction that will fail when used to call `batchExecuteTransactions()` because the call to executable will fail.
            const transaction2 = await generateZeroExTransactionAsync({ shouldSucceed: false });
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
            const transaction1 = await generateZeroExTransactionAsync({ shouldSucceed: false });

            // Create a transaction that will succeed when used to call `batchExecuteTransactions()`.
            const transaction2 = await generateZeroExTransactionAsync();
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
            const transaction1 = await generateZeroExTransactionAsync({ signerAddress: accounts[1] });

            // Duplicate the first transaction. This should cause the call to `batchExecuteTransactions()` to fail
            // because this transaction will have the same order hash as transaction1.
            const transaction2 = transaction1;
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
            // Create a transaction that will succeed when used to call `batchExecuteTransactions()`.
            const transaction = await generateZeroExTransactionAsync({
                signerAddress: accounts[1],
                returnData: '0xdeadbeef',
            });
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
            // Create two transactions that will succeed when used to call `batchExecuteTransactions()`.
            const transaction1 = await generateZeroExTransactionAsync({
                signerAddress: accounts[0],
                returnData: '0xdeadbeef',
            });
            const transaction2 = await generateZeroExTransactionAsync({
                signerAddress: accounts[1],
                returnData: '0xbeefdead',
            });
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
            const transaction = await generateZeroExTransactionAsync({
                expirationTimeSeconds: new BigNumber(currentTimestamp).minus(10), // Set the expiration time to before the current timestamp
            });
            const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);
            const expectedError = new ExchangeRevertErrors.TransactionError(
                ExchangeRevertErrors.TransactionErrorCode.Expired,
                transactionHash,
            );
            const tx = transactionsContract.executeTransaction.sendTransactionAsync(transaction, randomSignature());
            return expect(tx).to.revertWith(expectedError);
        });
        it('should revert if the transaction is submitted with a gasPrice that does not equal the required gasPrice', async () => {
            const transaction = await generateZeroExTransactionAsync();
            const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);
            const actualGasPrice = transaction.gasPrice.plus(1);
            const expectedError = new ExchangeRevertErrors.TransactionGasPriceError(
                transactionHash,
                actualGasPrice,
                transaction.gasPrice,
            );
            const tx = transactionsContract.executeTransaction.sendTransactionAsync(transaction, randomSignature(), {
                gasPrice: actualGasPrice,
            });
            return expect(tx).to.revertWith(expectedError);
        });
        // FIXME - This should be unskipped when the contracts have been updated to fix this problem.
        it.skip('should revert if reentrancy occurs in the middle of an executeTransaction call and msg.sender == signer for both calls', async () => {
            const validSignature = randomSignature();
            const transaction1 = await generateZeroExTransactionAsync({ signerAddress: accounts[0] });
            const transactionHash1 = transactionHashUtils.getTransactionHashHex(transaction1);
            const transaction2 = await generateZeroExTransactionAsync({
                signerAddress: accounts[0],
                callData: getExecuteTransactionCallData(transaction1, validSignature),
                returnData: '0xdeadbeef',
            });
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
            const transaction1 = await generateZeroExTransactionAsync({ signerAddress: accounts[0] });
            const transactionHash1 = transactionHashUtils.getTransactionHashHex(transaction1);
            const transaction2 = await generateZeroExTransactionAsync({
                signerAddress: accounts[0],
                callData: getExecuteTransactionCallData(transaction1, validSignature),
                returnData: '0xdeadbeef',
            });
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
            const transaction1 = await generateZeroExTransactionAsync({ signerAddress: accounts[1] });
            const transactionHash1 = transactionHashUtils.getTransactionHashHex(transaction1);
            const transaction2 = await generateZeroExTransactionAsync({
                signerAddress: accounts[0],
                callData: getExecuteTransactionCallData(transaction1, validSignature),
                returnData: '0xdeadbeef',
            });
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
            const transaction1 = await generateZeroExTransactionAsync({ signerAddress: accounts[0] });
            const transactionHash1 = transactionHashUtils.getTransactionHashHex(transaction1);
            const transaction2 = await generateZeroExTransactionAsync({
                signerAddress: accounts[0],
                callData: getExecuteTransactionCallData(transaction1, validSignature),
                returnData: '0xdeadbeef',
            });
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
            const transaction = await generateZeroExTransactionAsync();
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
            const transaction = await generateZeroExTransactionAsync({ signerAddress: accounts[1] });
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
            const transaction = await generateZeroExTransactionAsync({
                signerAddress: accounts[1],
                shouldSucceed: false,
            });
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
            const transaction = await generateZeroExTransactionAsync({
                signerAddress: accounts[1],
                shouldSucceed: false,
            });
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
            const validSignature = randomSignature(); // Valid because length != 2
            const transaction = await generateZeroExTransactionAsync({
                signerAddress: accounts[1],
                returnData: '0xdeadbeef',
            });
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

    blockchainTests.resets('assertExecutableTransaction', () => {
        it('should revert if the transaction is expired', async () => {
            const currentTimestamp = await getLatestBlockTimestampAsync();
            const transaction = await generateZeroExTransactionAsync({
                expirationTimeSeconds: new BigNumber(currentTimestamp).minus(10),
            });
            const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);
            const expectedError = new ExchangeRevertErrors.TransactionError(
                ExchangeRevertErrors.TransactionErrorCode.Expired,
                transactionHash,
            );
            expect(
                transactionsContract.assertExecutableTransaction.callAsync(transaction, randomSignature()),
            ).to.revertWith(expectedError);
        });
        it('should revert if the gasPrice is less than required', async () => {
            const transaction = await generateZeroExTransactionAsync({});
            const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);
            const actualGasPrice = transaction.gasPrice.minus(1);
            const expectedError = new ExchangeRevertErrors.TransactionGasPriceError(
                transactionHash,
                actualGasPrice,
                transaction.gasPrice,
            );
            expect(
                transactionsContract.assertExecutableTransaction.callAsync(transaction, randomSignature(), {
                    gasPrice: actualGasPrice,
                }),
            ).to.revertWith(expectedError);
        });
        it('should revert if the gasPrice is greater than required', async () => {
            const transaction = await generateZeroExTransactionAsync({});
            const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);
            const actualGasPrice = transaction.gasPrice.plus(1);
            const expectedError = new ExchangeRevertErrors.TransactionGasPriceError(
                transactionHash,
                actualGasPrice,
                transaction.gasPrice,
            );
            expect(
                transactionsContract.assertExecutableTransaction.callAsync(transaction, randomSignature(), {
                    gasPrice: actualGasPrice,
                }),
            ).to.revertWith(expectedError);
        });
        it('should revert if currentContextAddress is non-zero', async () => {
            await transactionsContract.setCurrentContextAddress.awaitTransactionSuccessAsync(accounts[0]);
            const transaction = await generateZeroExTransactionAsync({});
            const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);
            const expectedError = new ExchangeRevertErrors.TransactionError(
                ExchangeRevertErrors.TransactionErrorCode.NoReentrancy,
                transactionHash,
            );
            expect(
                transactionsContract.assertExecutableTransaction.callAsync(transaction, randomSignature()),
            ).to.revertWith(expectedError);
        });
        it('should revert if the transaction has already been executed', async () => {
            const transaction = await generateZeroExTransactionAsync({});
            const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);
            await transactionsContract.setTransactionHash.awaitTransactionSuccessAsync(transactionHash);
            const expectedError = new ExchangeRevertErrors.TransactionError(
                ExchangeRevertErrors.TransactionErrorCode.AlreadyExecuted,
                transactionHash,
            );
            expect(
                transactionsContract.assertExecutableTransaction.callAsync(transaction, randomSignature()),
            ).to.revertWith(expectedError);
        });
        it('should revert if signer != msg.sender and the signature is invalid', async () => {
            const transaction = await generateZeroExTransactionAsync({ signerAddress: accounts[0] });
            const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);
            const invalidSignature = '0x0000';
            const expectedError = new ExchangeRevertErrors.TransactionSignatureError(
                transactionHash,
                accounts[0],
                invalidSignature,
            );
            expect(
                transactionsContract.assertExecutableTransaction.callAsync(transaction, invalidSignature, {
                    from: accounts[1],
                }),
            ).to.revertWith(expectedError);
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
