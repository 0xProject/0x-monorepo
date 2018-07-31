import { addressSchema, hexSchema, numberSchema } from '../schemas/basic_type_schemas';
import { blockParamSchema, blockRangeSchema } from '../schemas/block_range_schema';
import { callDataSchema } from '../schemas/call_data_schema';
import { ecSignatureParameterSchema, ecSignatureSchema } from '../schemas/ec_signature_schema';
import { indexFilterValuesSchema } from '../schemas/index_filter_values_schema';
import { orderCancellationRequestsSchema } from '../schemas/order_cancel_schema';
import { orderFillOrKillRequestsSchema } from '../schemas/order_fill_or_kill_requests_schema';
import { orderFillRequestsSchema } from '../schemas/order_fill_requests_schema';
import { orderHashSchema } from '../schemas/order_hash_schema';
import { orderSchema, signedOrderSchema } from '../schemas/order_schemas';
import { ordersSchema } from '../schemas/orders_schema';
import {
    relayerApiAssetDataPairsResponseSchema,
    relayerApiAssetDataTradeInfoSchema,
} from '../schemas/relayer_api_asset_pairs_response_schema';
import { relayerApiErrorResponseSchema } from '../schemas/relayer_api_error_response_schema';
import { relayerApiOrderConfigPayloadSchema } from '../schemas/relayer_api_order_config_payload_schema';
import { relayerApiOrderConfigResponseSchema } from '../schemas/relayer_api_order_config_response_schema';
import { relayerApiOrderBookResponseSchema } from '../schemas/relayer_api_orderbook_response_schema';
import {
    relayerApiOrdersChannelSubscribePayload,
    relayerApiOrdersChannelSubscribeSchema,
} from '../schemas/relayer_api_orders_channel_subscribe_schema';
import { relayerApiOrdersChannelUpdateSchema } from '../schemas/relayer_api_orders_channel_update_response_schema';
import { signedOrdersSchema } from '../schemas/signed_orders_schema';
import { tokenSchema } from '../schemas/token_schema';
import { jsNumber, txDataSchema } from '../schemas/tx_data_schema';

export const schemas = {
    numberSchema,
    addressSchema,
    callDataSchema,
    hexSchema,
    ecSignatureParameterSchema,
    ecSignatureSchema,
    indexFilterValuesSchema,
    orderCancellationRequestsSchema,
    orderFillOrKillRequestsSchema,
    orderFillRequestsSchema,
    orderHashSchema,
    orderSchema,
    signedOrderSchema,
    signedOrdersSchema,
    ordersSchema,
    blockParamSchema,
    blockRangeSchema,
    tokenSchema,
    jsNumber,
    txDataSchema,
    relayerApiErrorResponseSchema,
    relayerApiOrderConfigPayloadSchema,
    relayerApiOrderConfigResponseSchema,
    relayerApiOrderBookResponseSchema,
    relayerApiAssetPairsResponseSchema,
    relayerApiAssetTradeInfoSchema,
    relayerApiOrdersChannelSubscribeSchema,
    relayerApiOrdersChannelSubscribePayload,
    relayerApiOrdersChannelUpdateSchema,
};
