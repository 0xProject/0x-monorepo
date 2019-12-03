import { blockchainTests, constants, describe, expect, transactionHashUtils } from '@0x/contracts-test-utils';
import { EIP712DomainWithDefaultSchema, ZeroExTransaction } from '@0x/types';
import { BigNumber, ExchangeRevertErrors, hexRandom, StringRevertError } from '@0x/utils';
import { LogWithDecodedArgs } from 'ethereum-types';
import * as _ from 'lodash';

import { artifacts } from './artifacts';
import { TestTransactionsContract, TestTransactionsTransactionExecutionEventArgs } from './wrappers';

blockchainTests.resets('Transaction Unit Tests', ({ provider, web3Wrapper, txDefaults }) => {
    let transactionsContract: TestTransactionsContract;
    let accounts: string[];
    let domain: EIP712DomainWithDefaultSchema;

    const randomSignature = () => hexRandom(66);

    const EMPTY_ZERO_EX_TRANSACTION = {
        salt: constants.ZERO_AMOUNT,
        expirationTimeSeconds: constants.ZERO_AMOUNT,
        gasPrice: constants.ZERO_AMOUNT,
        signerAddress: constants.NULL_ADDRESS,
        data: constants.NULL_BYTES,
        domain: {
            verifyingContract: constants.NULL_ADDRESS,
            chainId: 0,
        },
    };

    const DEADBEEF_RETURN_DATA = '0xdeadbeef';
    const INVALID_SIGNATURE = '0x0000';

    before(async () => {
        // A list of available addresses to use during testing.
        accounts = await web3Wrapper.getAvailableAddressesAsync();

        // Deploy the transaction test contract.
        transactionsContract = await TestTransactionsContract.deployFrom0xArtifactAsync(
            artifacts.TestTransactions,
            provider,
            txDefaults,
            {},
        );

        // Set the default domain.
        domain = {
            verifyingContract: transactionsContract.address,
            chainId: 1337,
        };
    });

    /**
     * Generates calldata for a call to `executable()` in the `TestTransactions` contract.
     */
    function getExecutableCallData(shouldSucceed: boolean, callData: string, returnData: string): string {
        return (transactionsContract as any)
            .executable(shouldSucceed, callData, returnData)
            .getABIEncodedTransactionData();
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
            opts.expirationTimeSeconds === undefined ? constants.MAX_UINT256 : opts.expirationTimeSeconds;
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
            const tx = transactionsContract
                .batchExecuteTransactions([transaction], [randomSignature()])
                .awaitTransactionSuccessAsync();
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
            const tx = transactionsContract
                .batchExecuteTransactions([transaction1, transaction2], [randomSignature(), randomSignature()])
                .awaitTransactionSuccessAsync();
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
            const tx = transactionsContract
                .batchExecuteTransactions([transaction1, transaction2], [randomSignature(), randomSignature()])
                .awaitTransactionSuccessAsync();
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
            const tx = transactionsContract
                .batchExecuteTransactions([transaction1, transaction2], [randomSignature(), randomSignature()])
                .awaitTransactionSuccessAsync({
                    from: accounts[0],
                });
            return expect(tx).to.revertWith(expectedError);
        });

        it('should succeed if the only call to executeTransaction succeeds', async () => {
            // Create a transaction that will succeed when used to call `batchExecuteTransactions()`.
            const transaction = await generateZeroExTransactionAsync({
                signerAddress: accounts[1],
                returnData: DEADBEEF_RETURN_DATA,
            });
            const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);
            const validSignature = randomSignature();

            const contractFn = transactionsContract.batchExecuteTransactions([transaction], [validSignature]);
            const result = await contractFn.callAsync({ from: accounts[0] });
            const receipt = await contractFn.awaitTransactionSuccessAsync({ from: accounts[0] });

            expect(result.length).to.be.eq(1);
            const returnData = transactionsContract.getABIDecodedReturnData<void>('executeTransaction', result[0]);
            expect(returnData).to.equal(DEADBEEF_RETURN_DATA);

            // Ensure that the correct number of events were logged.
            const logs = receipt.logs as Array<LogWithDecodedArgs<TestTransactionsTransactionExecutionEventArgs>>;
            expect(logs.length).to.be.eq(2);

            // Ensure that the correct events were logged.
            expect(logs[0].event).to.be.eq('ExecutableCalled');
            expect(logs[0].args.data).to.be.eq(constants.NULL_BYTES);
            expect(logs[0].args.contextAddress).to.be.eq(accounts[1]);
            expect(logs[0].args.returnData).to.be.eq(DEADBEEF_RETURN_DATA);
            expect(logs[1].event).to.be.eq('TransactionExecution');
            expect(logs[1].args.transactionHash).to.eq(transactionHash);
        });

        it('should succeed if the both calls to executeTransaction succeed', async () => {
            // Create two transactions that will succeed when used to call `batchExecuteTransactions()`.
            const transaction1 = await generateZeroExTransactionAsync({
                signerAddress: accounts[0],
                returnData: DEADBEEF_RETURN_DATA,
            });
            const returnData2 = '0xbeefdead';
            const transaction2 = await generateZeroExTransactionAsync({
                signerAddress: accounts[1],
                returnData: returnData2,
            });
            const transactionHash1 = transactionHashUtils.getTransactionHashHex(transaction1);
            const transactionHash2 = transactionHashUtils.getTransactionHashHex(transaction2);

            const contractFn = transactionsContract.batchExecuteTransactions(
                [transaction1, transaction2],
                [randomSignature(), randomSignature()],
            );
            const result = await contractFn.callAsync({ from: accounts[0] });

            const receipt = await contractFn.awaitTransactionSuccessAsync({ from: accounts[0] });
            expect(result.length).to.be.eq(2);
            expect(transactionsContract.getABIDecodedReturnData('executeTransaction', result[0])).to.equal(
                DEADBEEF_RETURN_DATA,
            );
            expect(transactionsContract.getABIDecodedReturnData('executeTransaction', result[1])).to.equal(returnData2);

            // Verify that the correct number of events were logged.
            const logs = receipt.logs as Array<LogWithDecodedArgs<TestTransactionsTransactionExecutionEventArgs>>;
            expect(logs.length).to.be.eq(4);

            // Ensure that the correct events were logged.
            expect(logs[0].event).to.be.eq('ExecutableCalled');
            expect(logs[0].args.data).to.be.eq(constants.NULL_BYTES);
            expect(logs[0].args.returnData).to.be.eq(DEADBEEF_RETURN_DATA);
            expect(logs[0].args.contextAddress).to.be.eq(constants.NULL_ADDRESS);
            expect(logs[1].event).to.be.eq('TransactionExecution');
            expect(logs[1].args.transactionHash).to.eq(transactionHash1);
            expect(logs[2].event).to.be.eq('ExecutableCalled');
            expect(logs[2].args.data).to.be.eq(constants.NULL_BYTES);
            expect(logs[2].args.returnData).to.be.eq('0xbeefdead');
            expect(logs[2].args.contextAddress).to.be.eq(accounts[1]);
            expect(logs[3].event).to.be.eq('TransactionExecution');
            expect(logs[3].args.transactionHash).to.eq(transactionHash2);
        });
        it('should not allow recursion if currentContextAddress is already set', async () => {
            const innerTransaction1 = await generateZeroExTransactionAsync({ signerAddress: accounts[0] });
            const innerTransaction2 = await generateZeroExTransactionAsync({ signerAddress: accounts[1] });
            const innerBatchExecuteTransaction = await generateZeroExTransactionAsync({
                signerAddress: accounts[2],
                callData: transactionsContract
                    .batchExecuteTransactions(
                        [innerTransaction1, innerTransaction2],
                        [randomSignature(), randomSignature()],
                    )
                    .getABIEncodedTransactionData(),
            });
            const outerExecuteTransaction = await generateZeroExTransactionAsync({
                signerAddress: accounts[1],
                callData: transactionsContract
                    .executeTransaction(innerBatchExecuteTransaction, randomSignature())
                    .getABIEncodedTransactionData(),
            });
            const innerBatchExecuteTransactionHash = transactionHashUtils.getTransactionHashHex(
                innerBatchExecuteTransaction,
            );
            const innerExpectedError = new ExchangeRevertErrors.TransactionInvalidContextError(
                innerBatchExecuteTransactionHash,
                accounts[1],
            );
            const outerExecuteTransactionHash = transactionHashUtils.getTransactionHashHex(outerExecuteTransaction);
            const outerExpectedError = new ExchangeRevertErrors.TransactionExecutionError(
                outerExecuteTransactionHash,
                innerExpectedError.encode(),
            );
            const tx = transactionsContract
                .batchExecuteTransactions([outerExecuteTransaction], [randomSignature()])
                .awaitTransactionSuccessAsync({ from: accounts[2] });
            return expect(tx).to.revertWith(outerExpectedError);
        });
        it('should allow recursion as long as currentContextAddress is not set', async () => {
            const innerTransaction1 = await generateZeroExTransactionAsync({ signerAddress: accounts[0] });
            const innerTransaction2 = await generateZeroExTransactionAsync({ signerAddress: accounts[1] });
            // From this point on, all transactions and calls will have the same sender, which does not change currentContextAddress when called
            const innerBatchExecuteTransaction = await generateZeroExTransactionAsync({
                signerAddress: accounts[2],
                callData: transactionsContract
                    .batchExecuteTransactions(
                        [innerTransaction1, innerTransaction2],
                        [randomSignature(), randomSignature()],
                    )
                    .getABIEncodedTransactionData(),
            });
            const outerExecuteTransaction = await generateZeroExTransactionAsync({
                signerAddress: accounts[2],
                callData: transactionsContract
                    .executeTransaction(innerBatchExecuteTransaction, randomSignature())
                    .getABIEncodedTransactionData(),
            });
            return expect(
                transactionsContract
                    .batchExecuteTransactions([outerExecuteTransaction], [randomSignature()])
                    .awaitTransactionSuccessAsync({ from: accounts[2] }),
            ).to.be.fulfilled('');
        });
    });

    describe('executeTransaction', () => {
        function getExecuteTransactionCallData(transaction: ZeroExTransaction, signature: string): string {
            return (transactionsContract as any)
                .executeTransaction(transaction, signature)
                .getABIEncodedTransactionData();
        }
        it('should revert if the current time is past the expiration time', async () => {
            const transaction = await generateZeroExTransactionAsync({
                expirationTimeSeconds: constants.ZERO_AMOUNT,
            });
            const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);
            const expectedError = new ExchangeRevertErrors.TransactionError(
                ExchangeRevertErrors.TransactionErrorCode.Expired,
                transactionHash,
            );
            const tx = transactionsContract
                .executeTransaction(transaction, randomSignature())
                .awaitTransactionSuccessAsync();
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
            const tx = transactionsContract
                .executeTransaction(transaction, randomSignature())
                .awaitTransactionSuccessAsync({
                    gasPrice: actualGasPrice,
                });
            return expect(tx).to.revertWith(expectedError);
        });
        it('should revert if reentrancy occurs in the middle of an executeTransaction call and msg.sender != signer for both calls', async () => {
            const validSignature = randomSignature();
            const innerTransaction = await generateZeroExTransactionAsync({ signerAddress: accounts[0] });
            const innerTransactionHash = transactionHashUtils.getTransactionHashHex(innerTransaction);
            const outerTransaction = await generateZeroExTransactionAsync({
                signerAddress: accounts[0],
                callData: getExecuteTransactionCallData(innerTransaction, validSignature),
                returnData: DEADBEEF_RETURN_DATA,
            });
            const outerTransactionHash = transactionHashUtils.getTransactionHashHex(outerTransaction);
            const errorData = new ExchangeRevertErrors.TransactionInvalidContextError(
                innerTransactionHash,
                accounts[0],
            ).encode();
            const expectedError = new ExchangeRevertErrors.TransactionExecutionError(outerTransactionHash, errorData);
            const tx = transactionsContract
                .executeTransaction(outerTransaction, validSignature)
                .awaitTransactionSuccessAsync({
                    from: accounts[1], // Different then the signing addresses
                });
            return expect(tx).to.revertWith(expectedError);
        });
        it('should revert if reentrancy occurs in the middle of an executeTransaction call and msg.sender != signer and then msg.sender == signer', async () => {
            const validSignature = randomSignature();
            const innerTransaction = await generateZeroExTransactionAsync({ signerAddress: accounts[1] });
            const innerTransactionHash = transactionHashUtils.getTransactionHashHex(innerTransaction);
            const outerTransaction = await generateZeroExTransactionAsync({
                signerAddress: accounts[0],
                callData: getExecuteTransactionCallData(innerTransaction, validSignature),
                returnData: DEADBEEF_RETURN_DATA,
            });
            const outerTransactionHash = transactionHashUtils.getTransactionHashHex(outerTransaction);
            const errorData = new ExchangeRevertErrors.TransactionInvalidContextError(
                innerTransactionHash,
                accounts[0],
            ).encode();
            const expectedError = new ExchangeRevertErrors.TransactionExecutionError(outerTransactionHash, errorData);
            const tx = transactionsContract
                .executeTransaction(outerTransaction, validSignature)
                .awaitTransactionSuccessAsync({
                    from: accounts[1], // Different then the signing addresses
                });
            return expect(tx).to.revertWith(expectedError);
        });
        it('should allow reentrancy in the middle of an executeTransaction call if msg.sender == signer for both calls', async () => {
            const validSignature = randomSignature();
            const innerTransaction = await generateZeroExTransactionAsync({ signerAddress: accounts[0] });
            const outerTransaction = await generateZeroExTransactionAsync({
                signerAddress: accounts[0],
                callData: getExecuteTransactionCallData(innerTransaction, validSignature),
                returnData: DEADBEEF_RETURN_DATA,
            });
            return expect(
                transactionsContract.executeTransaction(outerTransaction, validSignature).awaitTransactionSuccessAsync({
                    from: accounts[0],
                }),
            ).to.be.fulfilled('');
        });
        it('should allow reentrancy in the middle of an executeTransaction call if msg.sender == signer and then msg.sender != signer', async () => {
            const validSignature = randomSignature();
            const innerTransaction = await generateZeroExTransactionAsync({ signerAddress: accounts[1] });
            const outerTransaction = await generateZeroExTransactionAsync({
                signerAddress: accounts[0],
                callData: getExecuteTransactionCallData(innerTransaction, validSignature),
                returnData: DEADBEEF_RETURN_DATA,
            });
            return expect(
                transactionsContract.executeTransaction(outerTransaction, validSignature).awaitTransactionSuccessAsync({
                    from: accounts[0],
                }),
            ).to.be.fulfilled('');
        });
        it('should revert if the transaction has been executed previously', async () => {
            const validSignature = randomSignature();
            const transaction = await generateZeroExTransactionAsync();
            const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);
            // Use the transaction in execute transaction.
            await expect(
                transactionsContract.executeTransaction(transaction, validSignature).awaitTransactionSuccessAsync(),
            ).to.be.fulfilled('');
            // Use the same transaction to make another call
            const expectedError = new ExchangeRevertErrors.TransactionError(
                ExchangeRevertErrors.TransactionErrorCode.AlreadyExecuted,
                transactionHash,
            );
            const tx = transactionsContract
                .executeTransaction(transaction, validSignature)
                .awaitTransactionSuccessAsync();
            return expect(tx).to.revertWith(expectedError);
        });
        it('should revert if the signer != msg.sender and the signature is not valid', async () => {
            const transaction = await generateZeroExTransactionAsync({ signerAddress: accounts[1] });
            const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);
            const expectedError = new ExchangeRevertErrors.SignatureError(
                ExchangeRevertErrors.SignatureErrorCode.BadTransactionSignature,
                transactionHash,
                accounts[1],
                INVALID_SIGNATURE,
            );
            const tx = transactionsContract
                .executeTransaction(transaction, INVALID_SIGNATURE)
                .awaitTransactionSuccessAsync({
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
            const tx = transactionsContract
                .executeTransaction(transaction, randomSignature())
                .awaitTransactionSuccessAsync({
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
            const tx = transactionsContract
                .executeTransaction(transaction, validSignature)
                .awaitTransactionSuccessAsync({
                    from: accounts[0],
                });
            return expect(tx).to.revertWith(expectedError);
        });
        it('should succeed with the correct return hash and event emitted when msg.sender != signer', async () => {
            // This calldata is encoded to succeed when it hits the executable function.
            const validSignature = randomSignature(); // Valid because length != 2
            const transaction = await generateZeroExTransactionAsync({
                signerAddress: accounts[1],
                returnData: DEADBEEF_RETURN_DATA,
            });
            const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);

            const contractFn = transactionsContract.executeTransaction(transaction, validSignature);
            const result = await contractFn.callAsync({ from: accounts[0] });

            const receipt = await contractFn.awaitTransactionSuccessAsync({ from: accounts[0] });
            expect(transactionsContract.getABIDecodedReturnData('executeTransaction', result)).to.equal(
                DEADBEEF_RETURN_DATA,
            );

            // Ensure that the correct number of events were logged.
            const logs = receipt.logs as Array<LogWithDecodedArgs<TestTransactionsTransactionExecutionEventArgs>>;
            expect(logs.length).to.be.eq(2);
            // Ensure that the correct events were logged.
            expect(logs[0].event).to.be.eq('ExecutableCalled');
            expect(logs[0].args.data).to.be.eq(constants.NULL_BYTES);
            expect(logs[0].args.returnData).to.be.eq(DEADBEEF_RETURN_DATA);
            expect(logs[0].args.contextAddress).to.be.eq(accounts[1]);
            expect(logs[1].event).to.be.eq('TransactionExecution');
            expect(logs[1].args.transactionHash).to.eq(transactionHash);
        });
        it('should succeed with the correct return hash and event emitted when msg.sender == signer', async () => {
            // This calldata is encoded to succeed when it hits the executable function.
            const validSignature = randomSignature(); // Valid because length != 2
            const transaction = await generateZeroExTransactionAsync({
                signerAddress: accounts[0],
                returnData: DEADBEEF_RETURN_DATA,
            });
            const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);

            const contractFn = transactionsContract.executeTransaction(transaction, validSignature);
            const result = await contractFn.callAsync({ from: accounts[0] });

            const receipt = await contractFn.awaitTransactionSuccessAsync({ from: accounts[0] });
            expect(transactionsContract.getABIDecodedReturnData('executeTransaction', result)).to.equal(
                DEADBEEF_RETURN_DATA,
            );

            // Ensure that the correct number of events were logged.
            const logs = receipt.logs as Array<LogWithDecodedArgs<TestTransactionsTransactionExecutionEventArgs>>;
            expect(logs.length).to.be.eq(2);
            // Ensure that the correct events were logged.
            expect(logs[0].event).to.be.eq('ExecutableCalled');
            expect(logs[0].args.data).to.be.eq(constants.NULL_BYTES);
            expect(logs[0].args.returnData).to.be.eq(DEADBEEF_RETURN_DATA);
            expect(logs[0].args.contextAddress).to.be.eq(constants.NULL_ADDRESS);
            expect(logs[1].event).to.be.eq('TransactionExecution');
            expect(logs[1].args.transactionHash).to.eq(transactionHash);
        });
    });

    blockchainTests.resets('assertExecutableTransaction', () => {
        it('should revert if the transaction is expired', async () => {
            const transaction = await generateZeroExTransactionAsync({
                expirationTimeSeconds: constants.ZERO_AMOUNT,
            });
            const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);
            const expectedError = new ExchangeRevertErrors.TransactionError(
                ExchangeRevertErrors.TransactionErrorCode.Expired,
                transactionHash,
            );
            expect(
                transactionsContract.assertExecutableTransaction(transaction, randomSignature()).callAsync(),
            ).to.revertWith(expectedError);
        });
        it('should revert if the gasPrice is less than required', async () => {
            const transaction = await generateZeroExTransactionAsync();
            const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);
            const actualGasPrice = transaction.gasPrice.minus(1);
            const expectedError = new ExchangeRevertErrors.TransactionGasPriceError(
                transactionHash,
                actualGasPrice,
                transaction.gasPrice,
            );
            expect(
                transactionsContract.assertExecutableTransaction(transaction, randomSignature()).callAsync({
                    gasPrice: actualGasPrice,
                }),
            ).to.revertWith(expectedError);
        });
        it('should revert if the gasPrice is greater than required', async () => {
            const transaction = await generateZeroExTransactionAsync();
            const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);
            const actualGasPrice = transaction.gasPrice.plus(1);
            const expectedError = new ExchangeRevertErrors.TransactionGasPriceError(
                transactionHash,
                actualGasPrice,
                transaction.gasPrice,
            );
            expect(
                transactionsContract.assertExecutableTransaction(transaction, randomSignature()).callAsync({
                    gasPrice: actualGasPrice,
                }),
            ).to.revertWith(expectedError);
        });
        it('should revert if currentContextAddress is non-zero', async () => {
            await transactionsContract.setCurrentContextAddress(accounts[0]).awaitTransactionSuccessAsync();
            const transaction = await generateZeroExTransactionAsync();
            const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);
            const expectedError = new ExchangeRevertErrors.TransactionInvalidContextError(transactionHash, accounts[0]);
            expect(
                transactionsContract.assertExecutableTransaction(transaction, randomSignature()).callAsync(),
            ).to.revertWith(expectedError);
        });
        it('should revert if the transaction has already been executed', async () => {
            const transaction = await generateZeroExTransactionAsync();
            const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);
            await transactionsContract.setTransactionExecuted(transactionHash).awaitTransactionSuccessAsync();
            const expectedError = new ExchangeRevertErrors.TransactionError(
                ExchangeRevertErrors.TransactionErrorCode.AlreadyExecuted,
                transactionHash,
            );
            expect(
                transactionsContract.assertExecutableTransaction(transaction, randomSignature()).callAsync(),
            ).to.revertWith(expectedError);
        });
        it('should revert if signer != msg.sender and the signature is invalid', async () => {
            const transaction = await generateZeroExTransactionAsync({ signerAddress: accounts[0] });
            const transactionHash = transactionHashUtils.getTransactionHashHex(transaction);
            const expectedError = new ExchangeRevertErrors.SignatureError(
                ExchangeRevertErrors.SignatureErrorCode.BadTransactionSignature,
                transactionHash,
                accounts[0],
                INVALID_SIGNATURE,
            );
            expect(
                transactionsContract.assertExecutableTransaction(transaction, INVALID_SIGNATURE).callAsync({
                    from: accounts[1],
                }),
            ).to.revertWith(expectedError);
        });
        it('should be successful if signer == msg.sender and the signature is invalid', async () => {
            const transaction = await generateZeroExTransactionAsync({ signerAddress: accounts[0] });
            return expect(
                transactionsContract.assertExecutableTransaction(transaction, INVALID_SIGNATURE).callAsync({
                    from: accounts[0],
                }),
            ).to.be.fulfilled('');
        });
        it('should be successful if signer == msg.sender and the signature is valid', async () => {
            const transaction = await generateZeroExTransactionAsync({ signerAddress: accounts[0] });
            return expect(
                transactionsContract.assertExecutableTransaction(transaction, randomSignature()).callAsync({
                    from: accounts[0],
                }),
            ).to.be.fulfilled('');
        });
        it('should be successful if not expired, the gasPrice is correct, the tx has not been executed, currentContextAddress has not been set, signer != msg.sender, and the signature is valid', async () => {
            const transaction = await generateZeroExTransactionAsync({ signerAddress: accounts[0] });
            return expect(
                transactionsContract.assertExecutableTransaction(transaction, randomSignature()).callAsync({
                    from: accounts[1],
                }),
            ).to.be.fulfilled('');
        });
    });

    describe('setCurrentContextAddressIfRequired', () => {
        it('should set the currentContextAddress if signer not equal to sender', async () => {
            const randomAddress = hexRandom(20);
            await transactionsContract
                .setCurrentContextAddressIfRequired(randomAddress, randomAddress)
                .awaitTransactionSuccessAsync();
            const currentContextAddress = await transactionsContract.currentContextAddress().callAsync();
            expect(currentContextAddress).to.eq(randomAddress);
        });
        it('should not set the currentContextAddress if signer equal to sender', async () => {
            const randomAddress = hexRandom(20);
            await transactionsContract
                .setCurrentContextAddressIfRequired(accounts[0], randomAddress)
                .awaitTransactionSuccessAsync({
                    from: accounts[0],
                });
            const currentContextAddress = await transactionsContract.currentContextAddress().callAsync();
            expect(currentContextAddress).to.eq(constants.NULL_ADDRESS);
        });
    });

    describe('getCurrentContext', () => {
        it('should return the sender address when there is not a saved context address', async () => {
            const currentContextAddress = await transactionsContract.getCurrentContextAddress().callAsync({
                from: accounts[0],
            });
            expect(currentContextAddress).to.be.eq(accounts[0]);
        });

        it('should return the sender address when there is a saved context address', async () => {
            // Set the current context address to the taker address
            await transactionsContract.setCurrentContextAddress(accounts[1]).awaitTransactionSuccessAsync();

            // Ensure that the queried current context address is the same as the address that was set.
            const currentContextAddress = await transactionsContract.getCurrentContextAddress().callAsync({
                from: accounts[0],
            });
            expect(currentContextAddress).to.be.eq(accounts[1]);
        });
    });
});
// tslint:disable-line:max-file-line-count
