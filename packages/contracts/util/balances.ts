import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';
import * as Web3 from 'web3';

import { DummyTokenContract } from '../src/contract_wrappers/generated/dummy_token';

import { BalancesByOwner } from './types';

export class Balances {
    private _tokenContractInstances: DummyTokenContract[];
    private _ownerAddresses: string[];
    constructor(tokenContractInstances: DummyTokenContract[], ownerAddresses: string[]) {
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
