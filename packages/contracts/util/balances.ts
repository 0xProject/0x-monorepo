import {BigNumber} from 'bignumber.js';
import * as _ from 'lodash';

import {bigNumberConfigs} from './bignumber_config';
import {BalancesByOwner, ContractInstance} from './types';

bigNumberConfigs.configure();

export class Balances {
    private tokenContractInstances: ContractInstance[];
    private ownerAddresses: string[];
    constructor(tokenContractInstances: ContractInstance[], ownerAddresses: string[]) {
        this.tokenContractInstances = tokenContractInstances;
        this.ownerAddresses = ownerAddresses;
    }
    public async getAsync(): Promise<BalancesByOwner> {
        const balancesByOwner: BalancesByOwner = {};
        for (const tokenContractInstance of this.tokenContractInstances) {
            for (const ownerAddress of this.ownerAddresses) {
                let balance = await tokenContractInstance.balanceOf(ownerAddress);
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
