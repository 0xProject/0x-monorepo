import {
    numberSchema,
    addressSchema,
} from '../schemas/basic_type_schemas';
import {
    ecSignatureSchema,
    ecSignatureParameterSchema,
} from '../schemas/ec_signature_schema';
import {
    indexFilterValuesSchema,
} from '../schemas/index_filter_values_schema';
import {
    orderCancellationRequestsSchema,
} from '../schemas/order_cancel_schema';
import {
    orderFillOrKillRequestsSchema,
} from '../schemas/order_fill_or_kill_requests_schema';
import {
    orderFillRequestsSchema,
} from '../schemas/order_fill_requests_schema';
import {
    orderHashSchema,
} from '../schemas/order_hash_schema';
import {
    orderSchema,
    signedOrderSchema,
} from '../schemas/order_schemas';
import {
    blockParamSchema,
    subscriptionOptsSchema,
} from '../schemas/subscription_opts_schema';
import {
    tokenSchema,
} from '../schemas/token_schema';
import {
    signedOrdersSchema,
} from '../schemas/signed_orders_schema';
import {
    relayerApiErrorResponseSchema,
} from '../schemas/relayer_api_error_response_schema';
import {
    relayerApiFeesResponseSchema,
} from '../schemas/relayer_api_fees_response_schema';
import {
    relayerApiFeesPayloadSchema,
} from '../schemas/relayer_api_fees_payload_schema';
import {
    relayerApiOrderBookResponseSchema,
} from '../schemas/relayer_api_orderbook_response_schema';
import {
    relayerApiTokenPairsResponseSchema,
    relayerApiTokenTradeInfoSchema,
} from '../schemas/relayer_api_token_pairs_response_schema';
import {
    jsNumber,
    txDataSchema,
} from '../schemas/tx_data_schema';
import {
    relayerApiOrderbookChannelSubscribeSchema,
    relayerApiOrderbookChannelSubscribePayload,
} from '../schemas/relayer_api_orberbook_channel_subscribe_schema';
import {
    relayerApiOrderbookChannelUpdateSchema,
} from '../schemas/relayer_api_orderbook_channel_update_response_schema';
import {
    relayerApiOrderbookChannelSnapshotSchema,
    relayerApiOrderbookChannelSnapshotPayload,
} from '../schemas/relayer_api_orderbook_channel_snapshot_schema';

export const schemas = {
    numberSchema,
    addressSchema,
    ecSignatureSchema,
    ecSignatureParameterSchema,
    indexFilterValuesSchema,
    orderCancellationRequestsSchema,
    orderFillOrKillRequestsSchema,
    orderFillRequestsSchema,
    orderHashSchema,
    orderSchema,
    signedOrderSchema,
    signedOrdersSchema,
    blockParamSchema,
    subscriptionOptsSchema,
    tokenSchema,
    jsNumber,
    txDataSchema,
    relayerApiErrorResponseSchema,
    relayerApiFeesPayloadSchema,
    relayerApiFeesResponseSchema,
    relayerApiOrderBookResponseSchema,
    relayerApiTokenPairsResponseSchema,
    relayerApiTokenTradeInfoSchema,
    relayerApiOrderbookChannelSubscribeSchema,
    relayerApiOrderbookChannelSubscribePayload,
    relayerApiOrderbookChannelUpdateSchema,
    relayerApiOrderbookChannelSnapshotSchema,
    relayerApiOrderbookChannelSnapshotPayload,
};
