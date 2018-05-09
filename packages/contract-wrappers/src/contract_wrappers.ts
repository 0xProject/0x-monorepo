import { schemas, SchemaValidator } from '@0xproject/json-schemas';
import {
    generatePseudoRandomSalt,
    getOrderHashHex,
    isValidOrderHash,
    isValidSignature,
    signOrderHashAsync,
} from '@0xproject/order-utils';
import { ECSignature, Order, Provider, SignedOrder, TransactionReceiptWithDecodedLogs } from '@0xproject/types';
import { AbiDecoder, BigNumber, intervalUtils } from '@0xproject/utils';
import { Web3Wrapper } from '@0xproject/web3-wrapper';
import * as ethUtil from 'ethereumjs-util';
import * as _ from 'lodash';

import { artifacts } from './artifacts';
import { EtherTokenWrapper } from './contract_wrappers/ether_token_wrapper';
import { ExchangeWrapper } from './contract_wrappers/exchange_wrapper';
import { TokenRegistryWrapper } from './contract_wrappers/token_registry_wrapper';
import { TokenTransferProxyWrapper } from './contract_wrappers/token_transfer_proxy_wrapper';
import { TokenWrapper } from './contract_wrappers/token_wrapper';
import { zeroExContractConfigSchema } from './schemas/zero_ex_contract_config_schema';
import { zeroExContractPrivateNetworkConfigSchema } from './schemas/zero_ex_contract_private_network_config_schema';
import { zeroExContractPublicNetworkConfigSchema } from './schemas/zero_ex_contract_public_network_config_schema';
import { ZeroExContractConfig } from './types';
import { assert } from './utils/assert';
import { constants } from './utils/constants';
import { decorators } from './utils/decorators';
import { utils } from './utils/utils';

/**
 * The ContractWrappers class contains smart contract wrappers helpful when building on 0x protocol.
 */
export class ContractWrappers {
    /**
     * An instance of the ExchangeWrapper class containing methods for interacting with the 0x Exchange smart contract.
     */
    public exchange: ExchangeWrapper;
    /**
     * An instance of the TokenRegistryWrapper class containing methods for interacting with the 0x
     * TokenRegistry smart contract.
     */
    public tokenRegistry: TokenRegistryWrapper;
    /**
     * An instance of the TokenWrapper class containing methods for interacting with any ERC20 token smart contract.
     */
    public token: TokenWrapper;
    /**
     * An instance of the EtherTokenWrapper class containing methods for interacting with the
     * wrapped ETH ERC20 token smart contract.
     */
    public etherToken: EtherTokenWrapper;
    /**
     * An instance of the TokenTransferProxyWrapper class containing methods for interacting with the
     * tokenTransferProxy smart contract.
     */
    public proxy: TokenTransferProxyWrapper;
    private _web3Wrapper: Web3Wrapper;
    /**
     * Instantiates a new ContractWrappers instance.
     * @param   provider    The Provider instance you would like the 0x.js library to use for interacting with
     *                      the Ethereum network.
     * @param   config      The configuration object. Look up the type for the description.
     * @return  An instance of the ContractWrappers class.
     */
    constructor(provider: Provider, config: ZeroExContractConfig) {
        assert.isWeb3Provider('provider', provider);
        assert.doesConformToSchema('config', config, zeroExContractConfigSchema, [
            zeroExContractPrivateNetworkConfigSchema,
            zeroExContractPublicNetworkConfigSchema,
        ]);
        const artifactJSONs = _.values(artifacts);
        const abiArrays = _.map(artifactJSONs, artifact => artifact.abi);
        const defaults = {
            gasPrice: config.gasPrice,
        };
        this._web3Wrapper = new Web3Wrapper(provider, defaults);
        _.forEach(abiArrays, abi => {
            this._web3Wrapper.abiDecoder.addABI(abi);
        });
        this.proxy = new TokenTransferProxyWrapper(
            this._web3Wrapper,
            config.networkId,
            config.tokenTransferProxyContractAddress,
        );
        this.token = new TokenWrapper(this._web3Wrapper, config.networkId, this.proxy);
        this.exchange = new ExchangeWrapper(
            this._web3Wrapper,
            config.networkId,
            this.token,
            config.exchangeContractAddress,
            config.zrxContractAddress,
        );
        this.tokenRegistry = new TokenRegistryWrapper(
            this._web3Wrapper,
            config.networkId,
            config.tokenRegistryContractAddress,
        );
        this.etherToken = new EtherTokenWrapper(this._web3Wrapper, config.networkId, this.token);
    }
    /**
     * Sets a new web3 provider for 0x.js. Updating the provider will stop all
     * subscriptions so you will need to re-subscribe to all events relevant to your app after this call.
     * @param   provider    The Web3Provider you would like the 0x.js library to use from now on.
     * @param   networkId   The id of the network your provider is connected to
     */
    public setProvider(provider: Provider, networkId: number): void {
        this._web3Wrapper.setProvider(provider);
        (this.exchange as any)._invalidateContractInstances();
        (this.exchange as any)._setNetworkId(networkId);
        (this.tokenRegistry as any)._invalidateContractInstance();
        (this.tokenRegistry as any)._setNetworkId(networkId);
        (this.token as any)._invalidateContractInstances();
        (this.token as any)._setNetworkId(networkId);
        (this.proxy as any)._invalidateContractInstance();
        (this.proxy as any)._setNetworkId(networkId);
        (this.etherToken as any)._invalidateContractInstance();
        (this.etherToken as any)._setNetworkId(networkId);
    }
    /**
     * Get the provider instance currently used by 0x.js
     * @return  Web3 provider instance
     */
    public getProvider(): Provider {
        return this._web3Wrapper.getProvider();
    }
    /*
     * HACK: `TokenWrapper` needs a token transfer proxy address. `TokenTransferProxy` address is fetched from
     * an `ExchangeWrapper`. `ExchangeWrapper` needs `TokenWrapper` to validate orders, creating a dependency cycle.
     * In order to break this - we create this function here and pass it as a parameter to the `TokenWrapper`
     * and `ProxyWrapper`.
     */
    private async _getTokenTransferProxyAddressAsync(): Promise<string> {
        const tokenTransferProxyAddress = await (this.exchange as any)._getTokenTransferProxyAddressAsync();
        return tokenTransferProxyAddress;
    }
}
