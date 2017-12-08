import * as orderResponseJSON from './order/0xabc67323774bdbd24d94f977fa9ac94a50f016026fd13f42990861238897721f.json';

const orderJSONString = JSON.stringify(orderResponseJSON);

export const unknownOrderbookChannelMessage = `{
    "type": "superGoodUpdate",
    "channel": "orderbook",
    "requestId": 1,
    "payload": ${orderJSONString}
}`;
