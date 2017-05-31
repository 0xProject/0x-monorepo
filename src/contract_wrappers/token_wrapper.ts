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
        // The BigNumber instance returned by Web3 is of a much older version then our own, we therefore
        // should always re-instantiate the returned BigNumber after retrieval.
        balance = new BigNumber(balance);
        return balance;
    }
    /**
     * Retrieves the allowance in baseUnits of the ERC20 token set to the 0x proxy contract
     * by an owner address.
     */
    public async getProxyAllowanceAsync(tokenAddress: string, ownerAddress: string) {
        assert.isETHAddressHex('ownerAddress', ownerAddress);
        assert.isETHAddressHex('tokenAddress', tokenAddress);

        const tokenContract = await this.getTokenContractAsync(tokenAddress);
        const proxyAddress = await this.getProxyAddressAsync();
        let allowanceInBaseUnits = await tokenContract.allowance.call(ownerAddress, proxyAddress);
        allowanceInBaseUnits = new BigNumber(allowanceInBaseUnits);
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

        const tokenContract = await this.getTokenContractAsync(tokenAddress);
        const proxyAddress = await this.getProxyAddressAsync();
        // Hack: for some reason default estimated gas amount causes `base fee exceeds gas limit` exception
        // on testrpc. Probably related to https://github.com/ethereumjs/testrpc/issues/294
        // TODO: Debug issue in testrpc and submit a PR, then remove this hack
        const networkIdIfExists = await this.web3Wrapper.getNetworkIdIfExistsAsync();
        const gas = networkIdIfExists === constants.TESTRPC_NETWORK_ID ? ALLOWANCE_TO_ZERO_GAS_AMOUNT : undefined;
        await tokenContract.approve(proxyAddress, amountInBaseUnits, {
            from: ownerAddress,
            gas,
        });
    }
    /**
     * Transfers `amountInBaseUnits` ERC20 tokens from `fromAddress` to `toAddress`.
     */
    public async transferAsync(tokenAddress: string, fromAddress: string, toAddress: string,
                               amountInBaseUnits: BigNumber.BigNumber): Promise<void> {
        assert.isETHAddressHex('tokenAddress', tokenAddress);
        assert.isETHAddressHex('fromAddress', fromAddress);
        assert.isETHAddressHex('toAddress', toAddress);
        assert.isBigNumber('amountInBaseUnits', amountInBaseUnits);

        const tokenContract = await this.getTokenContractAsync(tokenAddress);
        await tokenContract.transfer(toAddress, amountInBaseUnits, {
            from: fromAddress,
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
