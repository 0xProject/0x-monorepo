import { addressUtils, logUtils } from '@0xproject/utils';
import * as express from 'express';
import * as _ from 'lodash';
import { Op } from 'sequelize';

import { models } from './models';

export const handler = {
    async getPrices(req: express.Request, res: express.Response) {
        const tokensParam = req.query.tokens; // should be a string of comma delimited token symbols
        const tokenSymbols = tokensParam.split(',');
        const data = await models.Price.findAll({
            attributes: ['symbol', 'base', 'price'],
            where: {
                [Op.or]: _.map(tokenSymbols, symbol => {
                    return { symbol };
                }),
            },
            order: [['timestamp', 'DESC']],
        });
        if (_.isEmpty(data)) {
            res.sendStatus(404);
            return;
        }
        const payload = _.map(tokenSymbols, symbol => {
            const matchingEntry = _.find(data, result => {
                return symbol === _.get(result, 'dataValues.symbol');
            });
            return _.get(matchingEntry, 'dataValues');
        });
        res.setHeader('Content-Type', 'application/json');
        res.status(200).send(payload);
    },
};
