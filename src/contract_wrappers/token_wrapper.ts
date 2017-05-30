import * as _ from 'lodash';
import * as BigNumber from 'bignumber.js';
import {Web3Wrapper} from '../web3_wrapper';
import {assert} from '../utils/assert';
import {ContractWrapper} from './contract_wrapper';
import * as TokenArtifacts from '../artifacts/Token.json';
import {TokenContract} from '../types';

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
}
