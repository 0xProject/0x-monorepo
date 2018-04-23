import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';
import * as Web3 from 'web3';

import { DummyERC20TokenContract } from '../contract_wrappers/generated/dummy_e_r_c20_token';

import { BalancesByOwner } from './types';

export class Balances {
    private _tokenContractInstances: DummyERC20TokenContract[];
    private _ownerAddresses: string[];
    constructor(tokenContractInstances: DummyERC20TokenContract[], ownerAddresses: string[]) {
        this._tokenContractInstances = tokenContractInstances;
        this._ownerAddresses = ownerAddresses;
    }
    public async getAsync(): Promise<BalancesByOwner> {
        const balancesByOwner: BalancesByOwner = {};
        for (const tokenContractInstance of this._tokenContractInstances) {
            for (const ownerAddress of this._ownerAddresses) {
                let balance = await tokenContractInstance.balanceOf.callAsync(ownerAddress);
                balance = new BigNumber(balance);
                if (_.isUndefined(balancesByOwner[ownerAddress])) {
                    balancesByOwner[ownerAddress] = {};
                }
                balancesByOwner[ownerAddress][tokenContractInstance.address] = balance;
            }
        }
        return balancesByOwner;
    }
}
