import { addressUtils } from '@0x/utils';
import { NextFunction, Request, Response } from 'express';
import * as _ from 'lodash';

import { constants } from './constants';
import { rpcUrls } from './rpc_urls';

const DEFAULT_NETWORK_ID = 42; // kovan

export const parameterTransformer = {
    transform(req: Request, res: Response, next: NextFunction): void {
        const recipientAddress = req.params.recipient;
        if (_.isUndefined(recipientAddress) || !addressUtils.isAddress(recipientAddress)) {
            res.status(constants.BAD_REQUEST_STATUS).send('INVALID_RECIPIENT_ADDRESS');
            return;
        }
        const lowerCaseRecipientAddress = recipientAddress.toLowerCase();
        req.params.recipient = lowerCaseRecipientAddress;
        const networkId = _.get(req.query, 'networkId', DEFAULT_NETWORK_ID);
        const rpcUrlIfExists = _.get(rpcUrls, networkId);
        if (_.isUndefined(rpcUrlIfExists)) {
            res.status(constants.BAD_REQUEST_STATUS).send('UNSUPPORTED_NETWORK_ID');
            return;
        }
        req.params.networkId = networkId;
        next();
    },
};
