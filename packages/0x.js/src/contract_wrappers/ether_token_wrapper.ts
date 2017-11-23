import BigNumber from 'bignumber.js';
import * as _ from 'lodash';

import {artifacts} from '../artifacts';
import {EtherTokenContract, TransactionOpts, ZeroExError} from '../types';
import {assert} from '../utils/assert';
import {Web3Wrapper} from '../web3_wrapper';

import {ContractWrapper} from './contract_wrapper';
import {TokenWrapper} from './token_wrapper';

/**
 * This class includes all the functionality related to interacting with a wrapped Ether ERC20 token contract.
 * The caller can convert ETH into the equivalent number of wrapped ETH ERC20 tokens and back.
 */
export class EtherTokenWrapper extends ContractWrapper {
    private _etherTokenContractIfExists?: EtherTokenContract;
    private _tokenWrapper: TokenWrapper;
    private _contractAddressIfExists?: string;
    constructor(web3Wrapper: Web3Wrapper, tokenWrapper: TokenWrapper, contractAddressIfExists?: string) {
        super(web3Wrapper);
        this._tokenWrapper = tokenWrapper;
        this._contractAddressIfExists = contractAddressIfExists;
    }
    /**
     * Deposit ETH into the Wrapped ETH smart contract and issues the equivalent number of wrapped ETH tokens
     * to the depositor address. These wrapped ETH tokens can be used in 0x trades and are redeemable for 1-to-1
     * for ETH.
     * @param   amountInWei      Amount of ETH in Wei the caller wishes to deposit.
     * @param   depositor        The hex encoded user Ethereum address that would like to make the deposit.
     * @param   txOpts           Transaction parameters.
     * @return Transaction hash.
     */
    public async depositAsync(amountInWei: BigNumber, depositor: string, txOpts: TransactionOpts): Promise<string> {
        assert.isValidBaseUnitAmount('amountInWei', amountInWei);
        await assert.isSenderAddressAsync('depositor', depositor, this._web3Wrapper);

        const ethBalanceInWei = await this._web3Wrapper.getBalanceInWeiAsync(depositor);
        assert.assert(ethBalanceInWei.gte(amountInWei), ZeroExError.InsufficientEthBalanceForDeposit);

        const wethContract = await this._getEtherTokenContractAsync();
        const txHash = await wethContract.deposit.sendTransactionAsync({
            from: depositor,
            value: amountInWei,
            gas: txOpts.gasLimit,
            gasPrice: txOpts.gasPrice,
        });
        return txHash;
    }
    /**
     * Withdraw ETH to the withdrawer's address from the wrapped ETH smart contract in exchange for the
     * equivalent number of wrapped ETH tokens.
     * @param   amountInWei  Amount of ETH in Wei the caller wishes to withdraw.
     * @param   withdrawer   The hex encoded user Ethereum address that would like to make the withdrawl.
     * @param   txOpts       Transaction parameters.
     * @return Transaction hash.
     */
    public async withdrawAsync(amountInWei: BigNumber, withdrawer: string, txOpts: TransactionOpts): Promise<string> {
        assert.isValidBaseUnitAmount('amountInWei', amountInWei);
        await assert.isSenderAddressAsync('withdrawer', withdrawer, this._web3Wrapper);

        const wethContractAddress = this.getContractAddress();
        const WETHBalanceInBaseUnits = await this._tokenWrapper.getBalanceAsync(wethContractAddress, withdrawer);
        assert.assert(WETHBalanceInBaseUnits.gte(amountInWei), ZeroExError.InsufficientWEthBalanceForWithdrawal);

        const wethContract = await this._getEtherTokenContractAsync();
        const txHash = await wethContract.withdraw.sendTransactionAsync(amountInWei, {
            from: withdrawer,
            gas: txOpts.gasLimit,
            gasPrice: txOpts.gasPrice,
        });
        return txHash;
    }
    /**
     * Retrieves the Wrapped Ether token contract address
     * @return  The Wrapped Ether token contract address
     */
    public getContractAddress(): string {
        const contractAddress = this._getContractAddress(
            artifacts.EtherTokenArtifact, this._contractAddressIfExists,
        );
        return contractAddress;
    }
    private _invalidateContractInstance(): void {
        delete this._etherTokenContractIfExists;
    }
    private async _getEtherTokenContractAsync(): Promise<EtherTokenContract> {
        if (!_.isUndefined(this._etherTokenContractIfExists)) {
            return this._etherTokenContractIfExists;
        }
        const contractInstance = await this._instantiateContractIfExistsAsync<EtherTokenContract>(
            artifacts.EtherTokenArtifact, this._contractAddressIfExists,
        );
        this._etherTokenContractIfExists = contractInstance;
        return this._etherTokenContractIfExists;
    }
}
