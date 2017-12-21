import {Artifacts} from '../util/artifacts';
import {MultiSigConfigByNetwork} from '../util/types';
const {
    MultiSigWalletWithTimeLock,
    TokenTransferProxy,
    EtherToken,
    TokenRegistry,
} = new Artifacts(artifacts);

let multiSigConfigByNetwork: MultiSigConfigByNetwork;
try {
    /* tslint:disable */
    const multiSigConfig = require('./config/multisig');
    multiSigConfigByNetwork = multiSigConfig.multiSig;
    /* tslint:enable */
} catch (e) {
    multiSigConfigByNetwork = {};
}

module.exports = (deployer: any, network: string, accounts: string[]) => {
    const defaultConfig = {
        owners: [accounts[0], accounts[1]],
        confirmationsRequired: 2,
        secondsRequired: 0,
    };
    const config = multiSigConfigByNetwork[network] || defaultConfig;
    if (network !== 'live') {
            deployer.deploy(MultiSigWalletWithTimeLock, config.owners,
                            config.confirmationsRequired, config.secondsRequired)
            .then(() => {
                return deployer.deploy(TokenTransferProxy);
            }).then(() => {
                return deployer.deploy(TokenRegistry);
            }).then(() => {
                return deployer.deploy(EtherToken);
            });
    } else {
        deployer.deploy([
            [MultiSigWalletWithTimeLock, config.owners, config.confirmationsRequired, config.secondsRequired],
            TokenTransferProxy,
            TokenRegistry,
        ]);
    }
};
