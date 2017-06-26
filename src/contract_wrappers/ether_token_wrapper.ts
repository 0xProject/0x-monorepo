import * as _ from 'lodash';
import {Web3Wrapper} from '../web3_wrapper';
import {ContractWrapper} from './contract_wrapper';
import {TokenWrapper} from './token_wrapper';
import {EtherTokenContract, ZeroExError} from '../types';
import {assert} from '../utils/assert';
import * as EtherTokenArtifacts from '../artifacts/EtherToken.json';

/**
 * This class includes all the functionality related to interacting with a wrapped Ether ERC20 token contract.
 * The caller can convert Ether into the equivalent number of wrapped Ether ERC20 tokens and back.
 */
export class EtherTokenWrapper extends ContractWrapper {
    private _etherTokenContractIfExists?: EtherTokenContract;
    private _tokenWrapper: TokenWrapper;
    constructor(web3Wrapper: Web3Wrapper, tokenWrapper: TokenWrapper) {
        super(web3Wrapper);
        this._tokenWrapper = tokenWrapper;
    }
    /**
     * Deposits Ether into the wrapped Ether smart contract and issues the equivalent number of wrapped Ether tokens
     * to the depositor address. These wrapped Ether tokens can be used in 0x trades and are redeemable 1-to-1
     * for Ether.
     * @param   amountInWei     Amount of Ether denominated in wei the caller wishes to deposit.
     * @param   depositor       The hex encoded user Ethereum address that would like to make the deposit.
     */
    public async depositAsync(amountInWei: BigNumber.BigNumber, depositor: string): Promise<void> {
        assert.isBigNumber('amountInWei', amountInWei);
        await assert.isSenderAddressAsync('depositor', depositor, this._web3Wrapper);

        const ethBalanceInWei = await this._web3Wrapper.getBalanceInWeiAsync(depositor);
        assert.assert(ethBalanceInWei.gte(amountInWei), ZeroExError.INSUFFICIENT_ETH_BALANCE_FOR_DEPOSIT);

        const wethContract = await this._getEtherTokenContractAsync();
        await wethContract.deposit({
            from: depositor,
            value: amountInWei,
        });
    }
    /**
     * Withdraw Ether to the withdrawer's address from the wrapped Ether smart contract in return for the
     * equivalent number of wrapped Ether tokens.
     * @param   amountInWei  Amount of Ether denominated in wei the caller wishes to withdraw.
     * @param   withdrawer   The hex encoded user Ethereum address that would like to make the withdrawal.
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
