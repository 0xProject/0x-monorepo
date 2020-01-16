import { BigNumber } from '@0x/utils';
import { LogWithDecodedArgs, TransactionReceiptWithDecodedLogs } from 'ethereum-types';
import * as _ from 'lodash';

import { ERC1155MintableContract, ERC1155TransferSingleEventArgs } from './wrappers';

export class Erc1155Wrapper {
    private readonly _erc1155Contract: ERC1155MintableContract;
    private readonly _contractOwner: string;

    constructor(contractInstance: ERC1155MintableContract, contractOwner: string) {
        this._erc1155Contract = contractInstance;
        this._contractOwner = contractOwner;
    }
    public getContract(): ERC1155MintableContract {
        return this._erc1155Contract;
    }
    public async getBalancesAsync(owners: string[], tokens: BigNumber[]): Promise<BigNumber[]> {
        const balances = await this._erc1155Contract.balanceOfBatch(owners, tokens).callAsync();
        return balances;
    }
    public async safeTransferFromAsync(
        from: string,
        to: string,
        token: BigNumber,
        value: BigNumber,
        callbackData?: string,
        delegatedSpender?: string,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const spender = delegatedSpender === undefined ? from : delegatedSpender;
        const callbackDataHex = callbackData === undefined ? '0x' : callbackData;
        const tx = await this._erc1155Contract
            .safeTransferFrom(from, to, token, value, callbackDataHex)
            .awaitTransactionSuccessAsync({
                from: spender,
            });
        return tx;
    }
    public async safeBatchTransferFromAsync(
        from: string,
        to: string,
        tokens: BigNumber[],
        values: BigNumber[],
        callbackData?: string,
        delegatedSpender?: string,
    ): Promise<TransactionReceiptWithDecodedLogs> {
        const spender = delegatedSpender === undefined ? from : delegatedSpender;
        const callbackDataHex = callbackData === undefined ? '0x' : callbackData;
        const tx = await this._erc1155Contract
            .safeBatchTransferFrom(from, to, tokens, values, callbackDataHex)
            .awaitTransactionSuccessAsync({ from: spender });
        return tx;
    }
    public async mintFungibleTokensAsync(
        beneficiaries: string[],
        tokenAmounts: BigNumber | BigNumber[],
    ): Promise<BigNumber> {
        const tokenUri = 'dummyFungibleToken';
        const tokenIsNonFungible = false;
        const tx = await this._erc1155Contract.create(tokenUri, tokenIsNonFungible).awaitTransactionSuccessAsync({
            from: this._contractOwner,
        });
        // tslint:disable-next-line no-unnecessary-type-assertion
        const createFungibleTokenLog = tx.logs[0] as LogWithDecodedArgs<ERC1155TransferSingleEventArgs>;
        const tokenId = createFungibleTokenLog.args.id;
        await this.mintKnownFungibleTokensAsync(tokenId, beneficiaries, tokenAmounts);
        return tokenId;
    }
    public async mintKnownFungibleTokensAsync(
        tokenId: BigNumber,
        beneficiaries: string[],
        tokenAmounts: BigNumber | BigNumber[],
    ): Promise<void> {
        const tokenAmountsAsArray = _.isArray(tokenAmounts) ? tokenAmounts : [];
        if (!_.isArray(tokenAmounts)) {
            _.each(_.range(0, beneficiaries.length), () => {
                tokenAmountsAsArray.push(tokenAmounts);
            });
        }
        await this._erc1155Contract
            .mintFungible(tokenId, beneficiaries, tokenAmountsAsArray)
            .awaitTransactionSuccessAsync({ from: this._contractOwner });
    }
    public async mintNonFungibleTokensAsync(beneficiaries: string[]): Promise<[BigNumber, BigNumber[]]> {
        const tokenUri = 'dummyNonFungibleToken';
        const tokenIsNonFungible = true;
        const tx = await this._erc1155Contract.create(tokenUri, tokenIsNonFungible).awaitTransactionSuccessAsync({
            from: this._contractOwner,
        });
        // tslint:disable-next-line no-unnecessary-type-assertion
        const createFungibleTokenLog = tx.logs[0] as LogWithDecodedArgs<ERC1155TransferSingleEventArgs>;
        const token = createFungibleTokenLog.args.id;
        await this._erc1155Contract.mintNonFungible(token, beneficiaries).awaitTransactionSuccessAsync({
            from: this._contractOwner,
        });
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
        const tx = await this._erc1155Contract.setApprovalForAll(beneficiary, isApproved).awaitTransactionSuccessAsync({
            from: owner,
        });
        return tx;
    }
    public async isApprovedForAllAsync(owner: string, beneficiary: string): Promise<boolean> {
        const isApprovedForAll = await this._erc1155Contract.isApprovedForAll(owner, beneficiary).callAsync();
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
            if (!balance.isEqualTo(expectedBalances[i])) {
                throw new Error(`${ownersExtended[i]}${tokensExtended[i]} balance not equal ${expectedBalances[i]}`);
            }
        });
    }
    public async isNonFungibleItemAsync(tokenId: BigNumber): Promise<boolean> {
        return this._erc1155Contract.isNonFungibleItem(tokenId).callAsync();
    }
    public async isFungibleItemAsync(tokenId: BigNumber): Promise<boolean> {
        return !(await this.isNonFungibleItemAsync(tokenId));
    }
    public async getOwnerOfAsync(tokenId: BigNumber): Promise<string> {
        return this._erc1155Contract.ownerOf(tokenId).callAsync();
    }
    /**
     * @dev Get the balance of an ERC1155 token for a given owner and token ID.
     */
    public async getBalanceAsync(ownerAddress: string, tokenId: BigNumber): Promise<BigNumber> {
        return this._erc1155Contract.balanceOf(ownerAddress, tokenId).callAsync();
    }
}
