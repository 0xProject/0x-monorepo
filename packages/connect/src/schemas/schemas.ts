import { feesRequestSchema } from './fees_request_schema';
import { nodeWebSocketOrderbookChannelConfigSchema } from './node_websocket_orderbook_channel_config_schema';
import { orderBookRequestSchema } from './orderbook_request_schema';
import { ordersRequestOptsSchema } from './orders_request_opts_schema';
import { pagedRequestOptsSchema } from './paged_request_opts_schema';
import { tokenPairsRequestOptsSchema } from './token_pairs_request_opts_schema';

export const schemas = {
    feesRequestSchema,
    nodeWebSocketOrderbookChannelConfigSchema,
    orderBookRequestSchema,
    ordersRequestOptsSchema,
    pagedRequestOptsSchema,
    tokenPairsRequestOptsSchema,
};
