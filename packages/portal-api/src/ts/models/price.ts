import * as Sequelize from 'sequelize';

const name = 'price';
const attributes: Sequelize.DefineAttributes = {
    timestamp: {
        type: Sequelize.TIME,
        primaryKey: true,
    },
    symbol: {
        type: Sequelize.CHAR,
        primaryKey: true,
    },
    base: {
        type: Sequelize.CHAR,
    },
    price: {
        type: Sequelize.NUMERIC,
    },
};

export const config = {
    name,
    attributes,
};
