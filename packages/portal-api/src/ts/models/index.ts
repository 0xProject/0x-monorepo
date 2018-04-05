import * as Sequelize from 'sequelize';

import { configs } from '../configs';

import { config as priceConfig } from './price';

const sequelize = new Sequelize(configs.AURORA_DB, configs.AURORA_USER, configs.AURORA_PASSWORD, {
    dialect: 'postgres',
    host: configs.AURORA_HOST,
    port: configs.AURORA_PORT,
    logging: false,
    define: {
        timestamps: false,
    },
});

const Price = sequelize.define(priceConfig.name, priceConfig.attributes);

export const models = {
    Price,
};
