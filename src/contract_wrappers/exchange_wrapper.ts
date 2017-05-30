import * as _ from 'lodash';
import {Web3Wrapper} from '../web3_wrapper';
import {ECSignature, ZeroExError, ExchangeContract} from '../types';
import {assert} from '../utils/assert';
import {ContractWrapper} from './contract_wrapper';
import * as ExchangeArtifacts from '../artifacts/Exchange.json';
import {ecSignatureSchema} from '../schemas/ec_signature_schema';

export class ExchangeWrapper extends ContractWrapper {
    private exchangeContractIfExists?: ExchangeContract;
    constructor(web3Wrapper: Web3Wrapper) {
        super(web3Wrapper);
    }
    public invalidateContractInstance(): void {
        delete this.exchangeContractIfExists;
    }
    public async isValidSignatureAsync(dataHex: string, ecSignature: ECSignature,
                                       signerAddressHex: string): Promise<boolean> {
        assert.isHexString('dataHex', dataHex);
        assert.doesConformToSchema('ecSignature', ecSignature, ecSignatureSchema);
        assert.isETHAddressHex('signerAddressHex', signerAddressHex);

        const senderAddressIfExists = await this.web3Wrapper.getSenderAddressIfExistsAsync();
        assert.assert(!_.isUndefined(senderAddressIfExists), ZeroExError.USER_HAS_NO_ASSOCIATED_ADDRESSES);

        const exchangeContract = await this.getExchangeContractAsync();

        const isValidSignature = await exchangeContract.isValidSignature.call(
            signerAddressHex,
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
    private async getExchangeContractAsync(): Promise<ExchangeContract> {
        if (!_.isUndefined(this.exchangeContractIfExists)) {
            return this.exchangeContractIfExists;
        }
        const contractInstance = await this.instantiateContractIfExistsAsync((ExchangeArtifacts as any));
        this.exchangeContractIfExists = contractInstance as ExchangeContract;
        return this.exchangeContractIfExists;
    }
}
