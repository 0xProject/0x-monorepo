import {Artifacts} from '../util/artifacts';
import {ContractInstance} from '../util/types';
const {
  TokenTransferProxy,
  MultiSigWalletWithTimeLock,
  TokenRegistry,
} = new Artifacts(artifacts);

let tokenRegistry: ContractInstance;
module.exports = (deployer: any, network: string) => {
  if (network !== 'development') {
    deployer.then(async () => {
      return Promise.all([
        TokenTransferProxy.deployed(),
        TokenRegistry.deployed(),
      ]).then((instances: ContractInstance[]) => {
        let tokenTransferProxy: ContractInstance;
        [tokenTransferProxy, tokenRegistry] = instances;
        return tokenTransferProxy.transferOwnership(MultiSigWalletWithTimeLock.address);
      }).then(() => {
        return tokenRegistry.transferOwnership(MultiSigWalletWithTimeLock.address);
      });
    });
  }
};
