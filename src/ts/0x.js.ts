import * as BigNumber from 'bignumber.js';
import * as ethUtil from 'ethereumjs-util';
import {assert} from './utils/assert';
import {ECSignatureSchema} from './schemas/ec_signature_schema';

/**
 * Elliptic Curve signature
 */
export interface ECSignature {
    v: number;
    r: string;
    s: string;
}

export class ZeroEx {
    /**
     * Verifies that the elliptic curve signature `signature` was generated
     * by signing `data` with the private key corresponding to the `signer` address.
     */
    public static isValidSignature(data: string, signature: ECSignature, signer: ETHAddressHex): boolean {
        assert.isString('data', data);
        assert.doesConformToSchema('signature', signature, ECSignatureSchema);
        assert.isETHAddressHex('signer', signer);

        const dataBuff = ethUtil.toBuffer(data);
        const msgHashBuff = ethUtil.hashPersonalMessage(dataBuff);
        try {
            const pubKey = ethUtil.ecrecover(msgHashBuff,
                signature.v,
                ethUtil.toBuffer(signature.r),
                ethUtil.toBuffer(signature.s));
            const retrievedAddress = ethUtil.bufferToHex(ethUtil.pubToAddress(pubKey));
            return retrievedAddress === signer;
        } catch (err) {
            return false;
        }
    }
}
