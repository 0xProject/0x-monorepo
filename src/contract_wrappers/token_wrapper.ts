import * as _ from 'lodash';
import * as BigNumber from 'bignumber.js';
import {Web3Wrapper} from '../web3_wrapper';
import {assert} from '../utils/assert';
import {ContractWrapper} from './contract_wrapper';
import * as TokenArtifacts from '../artifacts/Token.json';
import * as ProxyArtifacts from '../artifacts/Proxy.json';
import {TokenContract, InternalError} from '../types';

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
     * Returns an owner's ERC20 token balance
     */
    public async getBalanceAsync(tokenAddress: string, ownerAddress: string): Promise<BigNumber.BigNumber> {
        assert.isETHAddressHex('ownerAddress', ownerAddress);
        assert.isETHAddressHex('tokenAddress', tokenAddress);

        const tokenContract = await this.getTokenContractAsync(tokenAddress);
        let balance = await tokenContract.balanceOf.call(ownerAddress);
        // The BigNumber instance returned by Web3 is of a much older version then our own, we therefore
        // should always re-instantiate the returned BigNumber after retrieval.
        balance = _.isUndefined(balance) ? new BigNumber(0) : new BigNumber(balance);
        return balance;
    }
    /**
     * Retrieves the allowance of an ERC20 token set to the 0x proxy contract by an owner address
     */
    public async getProxyAllowanceAsync(tokenAddress: string, ownerAddress: string) {
        assert.isETHAddressHex('ownerAddress', ownerAddress);
        assert.isETHAddressHex('tokenAddress', tokenAddress);

        const tokenContract = await this.getTokenContractAsync(tokenAddress);
        const proxyAddress = await this.getProxyAddressAsync();
        let allowance = await tokenContract.allowance.call(ownerAddress, proxyAddress);
        allowance = _.isUndefined(allowance) ? new BigNumber(0) : new BigNumber(allowance);
        return allowance;
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
            throw new Error(InternalError.PROXY_ADDRESS_NOT_FOUND);
        }
        const proxyAddress = proxyNetworkConfigsIfExists.address;
        return proxyAddress;
    }
}
