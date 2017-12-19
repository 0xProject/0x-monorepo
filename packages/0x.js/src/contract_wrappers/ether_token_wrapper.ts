import {Web3Wrapper} from '@0xproject/web3-wrapper';
import BigNumber from 'bignumber.js';
import * as _ from 'lodash';

import {artifacts} from '../artifacts';
import {TransactionOpts, ZeroExError} from '../types';
import {assert} from '../utils/assert';

import {ContractWrapper} from './contract_wrapper';
import {EtherTokenContract} from './generated/ether_token';
import {TokenWrapper} from './token_wrapper';

/**
 * This class includes all the functionality related to interacting with a wrapped Ether ERC20 token contract.
 * The caller can convert ETH into the equivalent number of wrapped ETH ERC20 tokens and back.
 */
export class EtherTokenWrapper extends ContractWrapper {
    private _etherTokenContractIfExists?: EtherTokenContract;
    private _tokenWrapper: TokenWrapper;
    constructor(web3Wrapper: Web3Wrapper, networkId: number, tokenWrapper: TokenWrapper) {
        super(web3Wrapper, networkId);
        this._tokenWrapper = tokenWrapper;
    }
    /**
     * Deposit ETH into the Wrapped ETH smart contract and issues the equivalent number of wrapped ETH tokens
     * to the depositor address. These wrapped ETH tokens can be used in 0x trades and are redeemable for 1-to-1
     * for ETH.
     * @param   etherTokenAddress   EtherToken address you wish to deposit into.
     * @param   amountInWei         Amount of ETH in Wei the caller wishes to deposit.
     * @param   depositor           The hex encoded user Ethereum address that would like to make the deposit.
     * @param   txOpts              Transaction parameters.
     * @return Transaction hash.
     */
    public async depositAsync(
        etherTokenAddress: string, amountInWei: BigNumber, depositor: string, txOpts: TransactionOpts = {},
    ): Promise<string> {
        assert.isValidBaseUnitAmount('amountInWei', amountInWei);
        await assert.isSenderAddressAsync('depositor', depositor, this._web3Wrapper);

        const ethBalanceInWei = await this._web3Wrapper.getBalanceInWeiAsync(depositor);
        assert.assert(ethBalanceInWei.gte(amountInWei), ZeroExError.InsufficientEthBalanceForDeposit);

        const wethContract = await this._getEtherTokenContractAsync(etherTokenAddress);
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
     * @param   etherTokenAddress   EtherToken address you wish to withdraw from.
     * @param   amountInWei  Amount of ETH in Wei the caller wishes to withdraw.
     * @param   withdrawer   The hex encoded user Ethereum address that would like to make the withdrawl.
     * @param   txOpts       Transaction parameters.
     * @return Transaction hash.
     */
    public async withdrawAsync(
        etherTokenAddress: string, amountInWei: BigNumber, withdrawer: string, txOpts: TransactionOpts = {},
    ): Promise<string> {
        assert.isValidBaseUnitAmount('amountInWei', amountInWei);
        await assert.isSenderAddressAsync('withdrawer', withdrawer, this._web3Wrapper);

        const WETHBalanceInBaseUnits = await this._tokenWrapper.getBalanceAsync(etherTokenAddress, withdrawer);
        assert.assert(WETHBalanceInBaseUnits.gte(amountInWei), ZeroExError.InsufficientWEthBalanceForWithdrawal);

        const wethContract = await this._getEtherTokenContractAsync(etherTokenAddress);
        const txHash = await wethContract.withdraw.sendTransactionAsync(amountInWei, {
            from: withdrawer,
            gas: txOpts.gasLimit,
            gasPrice: txOpts.gasPrice,
        });
        return txHash;
    }
    private _invalidateContractInstance(): void {
        delete this._etherTokenContractIfExists;
    }
    private async _getEtherTokenContractAsync(etherTokenAddress: string): Promise<EtherTokenContract> {
        const web3ContractInstance = await this._instantiateContractIfExistsAsync(
            artifacts.EtherTokenArtifact, etherTokenAddress,
        );
        const contractInstance = new EtherTokenContract(web3ContractInstance, this._web3Wrapper.getContractDefaults());
        this._etherTokenContractIfExists = contractInstance;
        return this._etherTokenContractIfExists;
    }
}
