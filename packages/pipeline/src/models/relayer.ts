// import { sequelize } from '../sequelize';
// import { Sequelize } from 'sequelize-typescript/lib/models/Sequelize';

// const relayer = sequelize.define('relayer', {
//     id: Sequelize.STRING,
//     name: Sequelize.STRING,
//     url: Sequelize.STRING,
//     model: Sequelize.ARRAY(Sequelize.STRING),
//     status: Sequelize.STRING,
//     sra_status: Sequelize.STRING,
//     sra_http_url: Sequelize.STRING,
//     known_fee_addresses: Sequelize.ARRAY(Sequelize.STRING(42)),
//     known_taker_addresses: Sequelize.ARRAY(Sequelize.STRING(42)),
//     relayer_type: Sequelize.ARRAY(Sequelize.STRING),
// });

const relayer = {
    tableName: 'relayers',
    tableProperties: {
        id: {
            type: 'integer',
        },
        name: {
            type: 'varchar',
        },
        url : {
            type: 'varchar',
        },
        model: {
            type: 'varchar[]',
        },
        status: {
            type: 'varchar',
        },
        sra_status: {
            type: 'varchar',
        },
        sra_http_url: {
            type: 'varchar',
        },
        known_fee_addresses: {
            type: 'char(42)[]',
        },
        known_taker_addresses: {
            type: 'char(42)[]',
        },
        relayer_type: {
            type: 'varchar',
        },
    },
};

const logToRelayerSchemaMapping: any = {
    'id' : 'id',
    'fields[\'Name\']': 'name',
    'fields[\'URL\']': 'url',
    'fields[\'Model\']': 'model',
    'fields[\'Status\']': 'status',
    'fields[\'SRA Status\']': 'sra_status',
    'fields[\'SRA HTTP URL\']': 'sra_http_url',
    'fields[\'Known Fee Addresses\']': 'known_fee_addresses',
    'fields[\'Known Taker Addresses\']': 'known_taker_addresses',
    'fields[\'Relayer Type\']': 'relayer_type',
};

export { relayer, logToRelayerSchemaMapping };
