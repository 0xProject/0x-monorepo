import { addressUtils } from '@0x/utils';
import { NextFunction, Request, Response } from 'express';
import * as _ from 'lodash';

import { constants } from './constants';
import { rpcUrls } from './rpc_urls';

const DEFAULT_CHAIN_ID = 42; // kovan

export const parameterTransformer = {
    transform(req: Request, res: Response, next: NextFunction): void {
        const recipientAddress = req.params.recipient;
        if (recipientAddress === undefined || !addressUtils.isAddress(recipientAddress)) {
            res.status(constants.BAD_REQUEST_STATUS).send('INVALID_RECIPIENT_ADDRESS');
            return;
        }
        const lowerCaseRecipientAddress = recipientAddress.toLowerCase();
        req.params.recipient = lowerCaseRecipientAddress;
        const chainId = _.get(req.query, 'chainId', DEFAULT_CHAIN_ID);
        const rpcUrlIfExists = _.get(rpcUrls, chainId);
        if (rpcUrlIfExists === undefined) {
            res.status(constants.BAD_REQUEST_STATUS).send('UNSUPPORTED_CHAIN_ID');
            return;
        }
        req.params.chainId = chainId;
        next();
    },
};
