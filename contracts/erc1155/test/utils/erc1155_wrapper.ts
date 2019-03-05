import { constants, LogDecoder } from '@0x/contracts-test-utils';
import { BigNumber } from '@0x/utils';
import { Web3Wrapper } from '@0x/web3-wrapper';
import * as chai from 'chai';
import { LogWithDecodedArgs, Provider, TransactionReceiptWithDecodedLogs } from 'ethereum-types';
import * as _ from 'lodash';

import { artifacts, ERC1155MintableContract, ERC1155TransferSingleEventArgs } from '../../src';

const expect = chai.expect;

export class Erc1155Wrapper {
    private readonly _erc1155Contract: ERC1155MintableContract;
    private readonly _web3Wrapper: Web3Wrapper;
    private readonly _contractOwner: string;
    private readonly _logDecoder: LogDecoder;

    constructor(contractInstance: ERC1155MintableContract, provider: Provider, contractOwner: string) {
        this._erc1155Contract = contractInstance;
        this._web3Wrapper = new Web3Wrapper(provider);
        this._contractOwner = contractOwner;
        this._logDecoder = new LogDecoder(this._web3Wrapper, artifacts);
    }
    public getContract(): ERC1155MintableContract {
        return this._erc1155Contract;
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
        delegatedSpender: string = '',
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const spender = _.isEmpty(delegatedSpender) ? from : delegatedSpender;
        const tx = await this._logDecoder.getTxWithDecodedLogsAsync(
            await this._erc1155Contract.safeTransferFrom.sendTransactionAsync(from, to, token, value, callbackData, {
                from: spender,
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
        delegatedSpender: string = '',
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const spender = _.isEmpty(delegatedSpender) ? from : delegatedSpender;
        const tx = await this._logDecoder.getTxWithDecodedLogsAsync(
            await this._erc1155Contract.safeBatchTransferFrom.sendTransactionAsync(
                from,
                to,
                tokens,
                values,
                callbackData,
                { from: spender },
            ),
        );
        return tx;
    }
    public async mintFungibleTokensAsync(
        beneficiaries: string[],
        tokenAmounts: BigNumber | BigNumber[],
    ): Promise<BigNumber> {
        const tokenUri = 'dummyFungibleToken';
        const tokenIsNonFungible = false;
        const tx = await this._logDecoder.getTxWithDecodedLogsAsync(
            await this._erc1155Contract.create.sendTransactionAsync(tokenUri, tokenIsNonFungible, {
                from: this._contractOwner,
            }),
        );
        // tslint:disable-next-line no-unnecessary-type-assertion
        const createFungibleTokenLog = tx.logs[0] as LogWithDecodedArgs<ERC1155TransferSingleEventArgs>;
        const token = createFungibleTokenLog.args.id;
        const tokenAmountsAsArray = _.isArray(tokenAmounts) ? tokenAmounts : [];
        if (!_.isArray(tokenAmounts)) {
            _.each(_.range(0, beneficiaries.length), () => {
                tokenAmountsAsArray.push(tokenAmounts);
            });
        }
        await this._web3Wrapper.awaitTransactionSuccessAsync(
            await this._erc1155Contract.mintFungible.sendTransactionAsync(token, beneficiaries, tokenAmountsAsArray, {
                from: this._contractOwner,
            }),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
        return token;
    }
    public async mintNonFungibleTokensAsync(beneficiaries: string[]): Promise<[BigNumber, BigNumber[]]> {
        const tokenUri = 'dummyNonFungibleToken';
        const tokenIsNonFungible = true;
        const tx = await this._logDecoder.getTxWithDecodedLogsAsync(
            await this._erc1155Contract.create.sendTransactionAsync(tokenUri, tokenIsNonFungible, {
                from: this._contractOwner,
            }),
        );
        // tslint:disable-next-line no-unnecessary-type-assertion
        const createFungibleTokenLog = tx.logs[0] as LogWithDecodedArgs<ERC1155TransferSingleEventArgs>;
        const token = createFungibleTokenLog.args.id;
        await this._web3Wrapper.awaitTransactionSuccessAsync(
            await this._erc1155Contract.mintNonFungible.sendTransactionAsync(token, beneficiaries, {
                from: this._contractOwner,
            }),
            constants.AWAIT_TRANSACTION_MINED_MS,
        );
        const encodedNftIds: BigNumber[] = [];
        const nftIdBegin = 1;
        const nftIdEnd = beneficiaries.length + 1;
        const nftIdRange = _.range(nftIdBegin, nftIdEnd);
        _.each(nftIdRange, (nftId: number) => {
            const encodedNftId = token.plus(nftId);
            encodedNftIds.push(encodedNftId);
        });
        return [token, encodedNftIds];
    }
    public async setApprovalForAllAsync(
        owner: string,
        beneficiary: string,
        isApproved: boolean,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const tx = await this._logDecoder.getTxWithDecodedLogsAsync(
            await this._erc1155Contract.setApprovalForAll.sendTransactionAsync(beneficiary, isApproved, {
                from: owner,
            }),
        );
        return tx;
    }
    public async isApprovedForAllAsync(owner: string, beneficiary: string): Promise<boolean> {
        const isApprovedForAll = await this._erc1155Contract.isApprovedForAll.callAsync(owner, beneficiary);
        return isApprovedForAll;
    }
    public async assertBalancesAsync(
        owners: string[],
        tokens: BigNumber[],
        expectedBalances: BigNumber[],
    ): Promise<void> {
        const ownersExtended: string[] = [];
        let tokensExtended: BigNumber[] = [];
        _.each(owners, (owner: string) => {
            tokensExtended = tokensExtended.concat(tokens);
            _.each(_.range(0, tokens.length), () => {
                ownersExtended.push(owner);
            });
        });
        const balances = await this.getBalancesAsync(ownersExtended, tokensExtended);
        _.each(balances, (balance: BigNumber, i: number) => {
            expect(balance, `${ownersExtended[i]}${tokensExtended[i]}`).to.be.bignumber.equal(expectedBalances[i]);
        });
    }
}
