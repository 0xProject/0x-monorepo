import * as _ from 'lodash';
import * as BigNumber from 'bignumber.js';
import {Web3Wrapper} from '../web3_wrapper';
import {assert} from '../utils/assert';
import {constants} from '../utils/constants';
import {ContractWrapper} from './contract_wrapper';
import * as TokenArtifacts from '../artifacts/Token.json';
import * as ProxyArtifacts from '../artifacts/Proxy.json';
import {TokenContract, ZeroExError} from '../types';

const ALLOWANCE_TO_ZERO_GAS_AMOUNT = 45730;

export class TokenWrapper extends ContractWrapper {
    private tokenContractsByAddress: {[address: string]: TokenContract};
    constructor(web3Wrapper: Web3Wrapper) {
        super(web3Wrapper);
        this.tokenContractsByAddress = {};
    }
    public invalidateContractInstances() {
        this.tokenContractsByAddress = {};
    }
    /**
     * Returns an owner's ERC20 token balance.
     */
    public async getBalanceAsync(tokenAddress: string, ownerAddress: string): Promise<BigNumber.BigNumber> {
        assert.isETHAddressHex('ownerAddress', ownerAddress);
        assert.isETHAddressHex('tokenAddress', tokenAddress);

        const tokenContract = await this.getTokenContractAsync(tokenAddress);
        let balance = await tokenContract.balanceOf.call(ownerAddress);
        // Wrap BigNumbers returned from web3 with our own (later) version of BigNumber
        balance = new BigNumber(balance);
        return balance;
    }
    /**
     * Sets the spender's allowance to a specified number of baseUnits on behalf of the owner address.
     * Equivalent to the ERC20 spec method `approve`.
     */
    public async setAllowanceAsync(tokenAddress: string, ownerAddress: string, spenderAddress: string,
                                   amountInBaseUnits: BigNumber.BigNumber): Promise<void> {
        await assert.isSenderAccountHexAsync('ownerAddress', ownerAddress, this.web3Wrapper);
        assert.isETHAddressHex('spenderAddress', spenderAddress);
        assert.isETHAddressHex('tokenAddress', tokenAddress);
        assert.isBigNumber('amountInBaseUnits', amountInBaseUnits);

        const tokenContract = await this.getTokenContractAsync(tokenAddress);
        // Hack: for some reason default estimated gas amount causes `base fee exceeds gas limit` exception
        // on testrpc. Probably related to https://github.com/ethereumjs/testrpc/issues/294
        // TODO: Debug issue in testrpc and submit a PR, then remove this hack
        const networkIdIfExists = await this.web3Wrapper.getNetworkIdIfExistsAsync();
        const gas = networkIdIfExists === constants.TESTRPC_NETWORK_ID ? ALLOWANCE_TO_ZERO_GAS_AMOUNT : undefined;
        await tokenContract.approve(spenderAddress, amountInBaseUnits, {
            from: ownerAddress,
            gas,
        });
    }
    /**
     * Retrieves the owners allowance in baseUnits set to the spender's address.
     */
    public async getAllowanceAsync(tokenAddress: string, ownerAddress: string, spenderAddress: string) {
        assert.isETHAddressHex('ownerAddress', ownerAddress);
        assert.isETHAddressHex('tokenAddress', tokenAddress);

        const tokenContract = await this.getTokenContractAsync(tokenAddress);
        let allowanceInBaseUnits = await tokenContract.allowance.call(ownerAddress, spenderAddress);
        // Wrap BigNumbers returned from web3 with our own (later) version of BigNumber
        allowanceInBaseUnits = new BigNumber(allowanceInBaseUnits);
        return allowanceInBaseUnits;
    }
    /**
     * Retrieves the owner's allowance in baseUnits set to the 0x proxy contract.
     */
    public async getProxyAllowanceAsync(tokenAddress: string, ownerAddress: string) {
        assert.isETHAddressHex('ownerAddress', ownerAddress);
        assert.isETHAddressHex('tokenAddress', tokenAddress);

        const proxyAddress = await this.getProxyAddressAsync();
        const allowanceInBaseUnits = await this.getAllowanceAsync(tokenAddress, ownerAddress, proxyAddress);
        return allowanceInBaseUnits;
    }
    /**
     * Sets the 0x proxy contract's allowance to a specified number of a tokens' baseUnits on behalf
     * of an owner address.
     */
    public async setProxyAllowanceAsync(tokenAddress: string, ownerAddress: string,
                                        amountInBaseUnits: BigNumber.BigNumber): Promise<void> {
        assert.isETHAddressHex('ownerAddress', ownerAddress);
        assert.isETHAddressHex('tokenAddress', tokenAddress);
        assert.isBigNumber('amountInBaseUnits', amountInBaseUnits);

        const proxyAddress = await this.getProxyAddressAsync();
        await this.setAllowanceAsync(tokenAddress, ownerAddress, proxyAddress, amountInBaseUnits);
    }
    /**
     * Transfers `amountInBaseUnits` ERC20 tokens from `fromAddress` to `toAddress`.
     */
    public async transferAsync(tokenAddress: string, fromAddress: string, toAddress: string,
                               amountInBaseUnits: BigNumber.BigNumber): Promise<void> {
        assert.isETHAddressHex('tokenAddress', tokenAddress);
        await assert.isSenderAccountHexAsync('fromAddress', fromAddress, this.web3Wrapper);
        assert.isETHAddressHex('toAddress', toAddress);
        assert.isBigNumber('amountInBaseUnits', amountInBaseUnits);

        const tokenContract = await this.getTokenContractAsync(tokenAddress);

        const fromAddressBalance = await this.getBalanceAsync(tokenAddress, fromAddress);
        if (fromAddressBalance.lessThan(amountInBaseUnits)) {
            throw new Error(ZeroExError.INSUFFICIENT_BALANCE_FOR_TRANSFER);
        }

        await tokenContract.transfer(toAddress, amountInBaseUnits, {
            from: fromAddress,
        });
    }
    /**
     * Transfers `amountInBaseUnits` ERC20 tokens from `fromAddress` to `toAddress`.
     * Requires the fromAddress to have sufficient funds and to have approved an allowance of
     * `amountInBaseUnits` for senderAccount.
     */
    public async transferFromAsync(tokenAddress: string, fromAddress: string, toAddress: string,
                                   senderAccount: string, amountInBaseUnits: BigNumber.BigNumber):
                                   Promise<void> {
        assert.isETHAddressHex('tokenAddress', tokenAddress);
        assert.isETHAddressHex('fromAddress', fromAddress);
        assert.isETHAddressHex('toAddress', toAddress);
        await assert.isSenderAccountHexAsync('senderAccount', senderAccount, this.web3Wrapper);
        assert.isBigNumber('amountInBaseUnits', amountInBaseUnits);

        const tokenContract = await this.getTokenContractAsync(tokenAddress);

        const fromAddressAllowance = await this.getAllowanceAsync(tokenAddress, fromAddress, senderAccount);
        if (fromAddressAllowance.lessThan(amountInBaseUnits)) {
            throw new Error(ZeroExError.INSUFFICIENT_ALLOWANCE_FOR_TRANSFER);
        }

        const fromAddressBalance = await this.getBalanceAsync(tokenAddress, fromAddress);
        if (fromAddressBalance.lessThan(amountInBaseUnits)) {
            throw new Error(ZeroExError.INSUFFICIENT_BALANCE_FOR_TRANSFER);
        }

        await tokenContract.transferFrom(fromAddress, toAddress, amountInBaseUnits, {
            from: senderAccount,
        });
    }
    private async getTokenContractAsync(tokenAddress: string): Promise<TokenContract> {
        let tokenContract = this.tokenContractsByAddress[tokenAddress];
        if (!_.isUndefined(tokenContract)) {
            return tokenContract;
        }
        const contractInstance = await this.instantiateContractIfExistsAsync((TokenArtifacts as any), tokenAddress);
        tokenContract = contractInstance as TokenContract;
        this.tokenContractsByAddress[tokenAddress] = tokenContract;
        return tokenContract;
    }
    private async getProxyAddressAsync() {
        const networkIdIfExists = await this.web3Wrapper.getNetworkIdIfExistsAsync();
        const proxyNetworkConfigsIfExists = _.isUndefined(networkIdIfExists) ?
                                       undefined :
                                       (ProxyArtifacts as any).networks[networkIdIfExists];
        if (_.isUndefined(proxyNetworkConfigsIfExists)) {
            throw new Error(ZeroExError.CONTRACT_NOT_DEPLOYED_ON_NETWORK);
        }
        const proxyAddress = proxyNetworkConfigsIfExists.address;
        return proxyAddress;
    }
}
