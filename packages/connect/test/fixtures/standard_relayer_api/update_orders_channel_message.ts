import * as apiOrderJSON from './order/0xabc67323774bdbd24d94f977fa9ac94a50f016026fd13f42990861238897721f.json';

const apiOrderJSONString = JSON.stringify(apiOrderJSON);

export const updateOrdersChannelMessage = `{
    "type": "update",
    "channel": "orders",
    "requestId": "5a1ce3a2-22b9-41e6-a615-68077512e9e2",
    "payload": [${apiOrderJSONString}]
}`;

export const malformedUpdateOrdersChannelMessage = `{
    "type": "update",
    "channel": "orders",
    "requestId": "4d8efcee-adde-4475-9601-f0b30962ca2b",
    "payload": {}
}`;
