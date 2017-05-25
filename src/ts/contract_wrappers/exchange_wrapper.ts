import * as _ from 'lodash';
import {Web3Wrapper} from '../web3_wrapper';
import {ECSignature, ZeroExError, ExchangeContract} from '../types';
import {assert} from '../utils/assert';
import {ContractWrapper} from './contract_wrapper';
import * as ExchangeArtifacts from '../artifacts/Exchange.json';
import {ECSignatureSchema} from '../schemas/ec_signature_schema';

export class ExchangeWrapper extends ContractWrapper {
    constructor(web3Wrapper: Web3Wrapper) {
        super(web3Wrapper);
    }
    public async isValidSignatureAsync(maker: string, ecSignature: ECSignature, dataHex: string) {
        assert.isString('maker', maker);
        assert.doesConformToSchema('ecSignature', ecSignature, ECSignatureSchema);
        assert.isHexString('dataHex', dataHex);

        const senderAddressIfExists = this.web3Wrapper.getSenderAddressIfExistsAsync();
        assert.assert(!_.isUndefined(senderAddressIfExists), ZeroExError.USER_HAS_NO_ASSOCIATED_ADDRESSES);

        // TODO: remove any here
        const contractInstance = await this.instantiateContractIfExistsAsync((ExchangeArtifacts as any));
        const exchangeInstance = contractInstance as ExchangeContract;

        const isValidSignature = await exchangeInstance.isValidSignature.call(
            maker,
            dataHex,
            ecSignature.v,
            ecSignature.r,
            ecSignature.s,
            {
                from: senderAddressIfExists,
            },
        );
        return isValidSignature;
    }
}
