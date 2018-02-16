import { feesRequestSchema } from './fees_request_schema';
import { orderBookRequestSchema } from './orderbook_request_schema';
import { ordersRequestOptsSchema } from './orders_request_opts_schema';
import { pagedRequestOptsSchema } from './paged_request_opts_schema';
import { tokenPairsRequestOptsSchema } from './token_pairs_request_opts_schema';
import { webSocketOrderbookChannelConfigSchema } from './websocket_orderbook_channel_config_schema';

export const schemas = {
    feesRequestSchema,
    orderBookRequestSchema,
    ordersRequestOptsSchema,
    pagedRequestOptsSchema,
    tokenPairsRequestOptsSchema,
    webSocketOrderbookChannelConfigSchema,
};
