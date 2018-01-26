import { addressUtils } from '@0xproject/utils';
import { NextFunction, Request, Response } from 'express';
import * as _ from 'lodash';

import { configs } from './configs';
import { rpcUrls } from './rpc_urls';
import { utils } from './utils';

const DEFAULT_NETWORK_ID = 42; // kovan

export const parameterExtractor = {
    extract(req: Request, res: Response, next: NextFunction) {
        const recipientAddress = req.params.recipient;
        if (_.isUndefined(recipientAddress) || !_isValidEthereumAddress(recipientAddress)) {
            res.status(400).send('INVALID_RECIPIENT_ADDRESS');
            return;
        }
        const lowerCaseRecipientAddress = recipientAddress.toLowerCase();
        req.recipientAddress = lowerCaseRecipientAddress;
        const networkId = _.get(req.query, 'networkId', DEFAULT_NETWORK_ID);
        const rpcUrl = _.get(rpcUrls, networkId);
        if (_.isUndefined(rpcUrl)) {
            res.status(400).send('UNSUPPORTED_NETWORK_ID');
            return;
        }
        req.networkId = networkId;
        next();
    },
};

function _isValidEthereumAddress(address: string): boolean {
    const lowercaseAddress = address.toLowerCase();
    return addressUtils.isAddress(lowercaseAddress);
}
