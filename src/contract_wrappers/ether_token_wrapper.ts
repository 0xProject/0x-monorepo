import * as _ from 'lodash';
import {Web3Wrapper} from '../web3_wrapper';
import {ContractWrapper} from './contract_wrapper';
import {TokenWrapper} from './token_wrapper';
import {EtherTokenContract, ZeroExError} from '../types';
import {assert} from '../utils/assert';
import * as EtherTokenArtifacts from '../artifacts/EtherToken.json';

/**
 * This class includes all the functionality related to interacting with a wrapped Ether ERC20 token contract.
 * The caller can convert ETH into the equivalent number of wrapped ETH ERC20 tokens and back.
 */
export class EtherTokenWrapper extends ContractWrapper {
    private _etherTokenContractIfExists?: EtherTokenContract;
    private _tokenWrapper: TokenWrapper;
    constructor(web3Wrapper: Web3Wrapper, tokenWrapper: TokenWrapper) {
        super(web3Wrapper);
        this._tokenWrapper = tokenWrapper;
    }
    /**
     * Deposit ETH into the Wrapped ETH smart contract and issues the equivalent number of wrapped ETH tokens
     * to the depositor address. These wrapped ETH tokens can be used in 0x trades and are redeemable for 1-to-1
     * for ETH.
     * @param   amountInWei      Amount of ETH in Wei the caller wishes to deposit.
     * @param   depositor   The hex encoded user Ethereum address that would like to make the deposit.
     */
    public async depositAsync(amountInWei: BigNumber.BigNumber, depositor: string): Promise<void> {
        assert.isBigNumber('amountInWei', amountInWei);
        await assert.isSenderAddressAsync('depositor', depositor, this._web3Wrapper);

        const ethBalance = await this._web3Wrapper.getBalanceInEthAsync(depositor);
        const ethBalanceInWei = this._web3Wrapper.toWei(ethBalance);
        assert.assert(ethBalanceInWei.gte(amountInWei), ZeroExError.INSUFFICIENT_ETH_BALANCE_FOR_DEPOSIT);

        const wethContract = await this._getEtherTokenContractAsync();
        await wethContract.deposit({
            from: depositor,
            value: amountInWei,
        });
    }
    /**
     * Withdraw ETH to the withdrawer's address from the wrapped ETH smart contract in exchange for the
     * equivalent number of wrapped ETH tokens.
     * @param   amountInWei  Amount of ETH in Wei the caller wishes to withdraw.
     * @param   withdrawer   The hex encoded user Ethereum address that would like to make the withdrawl.
     */
    public async withdrawAsync(amountInWei: BigNumber.BigNumber, withdrawer: string): Promise<void> {
        assert.isBigNumber('amountInWei', amountInWei);
        await assert.isSenderAddressAsync('withdrawer', withdrawer, this._web3Wrapper);

        const wethContractAddress = await this.getContractAddressAsync();
        const WETHBalanceInBaseUnits = await this._tokenWrapper.getBalanceAsync(wethContractAddress, withdrawer);
        assert.assert(WETHBalanceInBaseUnits.gte(amountInWei), ZeroExError.INSUFFICIENT_WETH_BALANCE_FOR_WITHDRAWAL);

        const wethContract = await this._getEtherTokenContractAsync();
        await wethContract.withdraw(amountInWei, {
            from: withdrawer,
        });
    }
    /**
     * Retrieves the Wrapped Ether token contract address
     * @return  The Wrapped Ether token contract address
     */
    public async getContractAddressAsync(): Promise<string> {
        const wethContract = await this._getEtherTokenContractAsync();
        return wethContract.address;
    }
    private async _getEtherTokenContractAsync(): Promise<EtherTokenContract> {
        if (!_.isUndefined(this._etherTokenContractIfExists)) {
            return this._etherTokenContractIfExists;
        }
        const contractInstance = await this._instantiateContractIfExistsAsync((EtherTokenArtifacts as any));
        this._etherTokenContractIfExists = contractInstance as EtherTokenContract;
        return this._etherTokenContractIfExists;
    }
}
