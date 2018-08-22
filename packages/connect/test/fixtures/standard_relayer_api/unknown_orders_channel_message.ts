import * as orderResponseJSON from './order/0xabc67323774bdbd24d94f977fa9ac94a50f016026fd13f42990861238897721f.json';

const orderJSONString = JSON.stringify(orderResponseJSON);

export const unknownOrdersChannelMessage = `{
    "type": "superGoodUpdate",
    "channel": "orderbook",
    "requestId": "6ce8c5a6-5c46-4027-a44a-51831c77b8a1",
    "payload": [${orderJSONString}]
}`;
