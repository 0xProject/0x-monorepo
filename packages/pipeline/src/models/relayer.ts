// const relayer = {
//     tableName: 'relayers',
//     tableProperties: {
//         id: {
//             type: 'integer',
//         },
//         name: {
//             type: 'varchar',
//         },
//         url : {
//             type: 'varchar',
//         },
//         model: {
//             type: 'varchar[]',
//         },
//         status: {
//             type: 'varchar',
//         },
//         sra_status: {
//             type: 'varchar',
//         },
//         sra_http_url: {
//             type: 'varchar',
//         },
//         known_fee_addresses: {
//             type: 'char(42)[]',
//         },
//         known_taker_addresses: {
//             type: 'char(42)[]',
//         },
//         relayer_type: {
//             type: 'varchar',
//         },
//     },
// };
const relayer = {
    tableName: 'relayers',
    tableProperties: {
        name: {
            type: 'varchar',
        },
        url: {
            type: 'varchar',
        },
        sra_http_endpoint: {
            type: 'varchar',
        },
        sra_ws_endpoint: {
            type: 'varchar',
        },
        fee_recipient_addresses: {
            type: 'char(42)[]',
        },
        taker_addresses: {
            type: 'char(42)[]',
        },
    },
};
// const logToRelayerSchemaMapping: any = {
//     'id' : 'id',
//     'fields[\'Name\']': 'name',
//     'fields[\'URL\']': 'url',
//     'fields[\'Model\']': 'model',
//     'fields[\'Status\']': 'status',
//     'fields[\'SRA Status\']': 'sra_status',
//     'fields[\'SRA HTTP URL\']': 'sra_http_url',
//     'fields[\'Known Fee Addresses\']': 'known_fee_addresses',
//     'fields[\'Known Taker Addresses\']': 'known_taker_addresses',
//     'fields[\'Relayer Type\']': 'relayer_type',
// };
const logToRelayerSchemaMapping: any = {
    name: 'name',
    homepage_url: 'url',
};
export { relayer, logToRelayerSchemaMapping };
