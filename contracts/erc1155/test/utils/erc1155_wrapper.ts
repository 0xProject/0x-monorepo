import { constants, LogDecoder, Web3ProviderEngine } from '@0x/contracts-test-utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as chai from 'chai';
import { LogWithDecodedArgs, TransactionReceiptWithDecodedLogs } from 'ethereum-types';
import * as _ from 'lodash';

import { BigNumber } from '@0x/utils';

import { artifacts, ERC1155MintableContract, ERC1155TransferSingleEventArgs } from '../../src';

const expect = chai.expect;

export class Erc1155Wrapper {
    private readonly _erc1155Contract: ERC1155MintableContract;
    private readonly _web3Wrapper: Web3Wrapper;
    private readonly _contractOwner: string;
    private readonly _logDecoder: LogDecoder;

    constructor(contractInstance: ERC1155MintableContract, provider: Web3ProviderEngine, contractOwner: string) {
        this._erc1155Contract = contractInstance;
        this._web3Wrapper = new Web3Wrapper(provider);
        this._contractOwner = contractOwner;
        this._logDecoder = new LogDecoder(this._web3Wrapper, artifacts);
    }
    public async getBalancesAsync(owners: string[], tokens: BigNumber[]): Promise<BigNumber[]> {
        const balances = await this._erc1155Contract.balanceOfBatch.callAsync(owners, tokens);
        return balances;
    }
    public async safeTransferFromAsync(
        from: string,
        to: string,
        token: BigNumber,
        value: BigNumber,
        callbackData: string = '0x',
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const tx = await this._logDecoder.getTxWithDecodedLogsAsync(
            await this._erc1155Contract.safeTransferFrom.sendTransactionAsync(from, to, token, value, callbackData, {
                from,
            }),
        );
        return tx;
    }
    public async safeBatchTransferFromAsync(
        from: string,
        to: string,
        tokens: BigNumber[],
        values: BigNumber[],
        callbackData: string = '0x',
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const tx = await this._logDecoder.getTxWithDecodedLogsAsync(
            await this._erc1155Contract.safeBatchTransferFrom.sendTransactionAsync(
                from,
                to,
                tokens,
                values,
                callbackData,
                { from },
            ),
        );
        return tx;
    }
    public async mintFungibleTokenAsync(beneficiary: string, tokenAmount: BigNumber): Promise<BigNumber> {
        const tokenUri = 'dummyFungibleToken';
        const tokenIsNonFungible = false;
        const tx = await this._logDecoder.getTxWithDecodedLogsAsync(
            await this._erc1155Contract.create.sendTransactionAsync(tokenUri, tokenIsNonFungible, {
                from: this._contractOwner,
            }),
        );
        // tslint:disable-next-line no-unnecessary-type-assertion
        const createFungibleTokenLog = tx.logs[0] as LogWithDecodedArgs<ERC1155TransferSingleEventArgs>;
        const token = createFungibleTokenLog.args._id;
        await this._web3Wrapper.awaitTransactionSuccessAsync(
            await this._erc1155Contract.mintFungible.sendTransactionAsync(token, [beneficiary], [tokenAmount], {
                from: this._contractOwner,
            }),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
        return token;
    }
    public async mintNonFungibleTokenAsync(beneficiary: string): Promise<[BigNumber, BigNumber]> {
        const tokenUri = 'dummyNonFungibleToken';
        const tokenIsNonFungible = true;
        const tx = await this._logDecoder.getTxWithDecodedLogsAsync(
            await this._erc1155Contract.create.sendTransactionAsync(tokenUri, tokenIsNonFungible, {
                from: this._contractOwner,
            }),
        );
        // tslint:disable-next-line no-unnecessary-type-assertion
        const createFungibleTokenLog = tx.logs[0] as LogWithDecodedArgs<ERC1155TransferSingleEventArgs>;
        const token = createFungibleTokenLog.args._id;
        await this._web3Wrapper.awaitTransactionSuccessAsync(
            await this._erc1155Contract.mintNonFungible.sendTransactionAsync(token, [beneficiary], {
                from: this._contractOwner,
            }),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
        const nftId = token.plus(1);
        return [token, nftId];
    }
    public async assertBalancesAsync(
        owners: string[],
        tokens: BigNumber[],
        expectedBalances: BigNumber[],
    ): Promise<void> {
        const ownersExtended: string[] = [];
        const tokensExtended: BigNumber[] = [];
        _.each(tokens, (token: BigNumber) => {
            ownersExtended.concat(owners);
            _.range(0, owners.length, () => {
                tokensExtended.push(token);
            });
        });
        const balances = await this.getBalancesAsync(ownersExtended, tokensExtended);
        _.each(balances, (balance: BigNumber, i: number) => {
            expect(balance, `${ownersExtended[i]}${tokensExtended[i]}`).to.be.bignumber.equal(expectedBalances[i]);
        });
    }
}
