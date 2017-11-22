import * as orderbookJSON from './orderbook.json';

const orderbookJsonString = JSON.stringify(orderbookJSON);

export const snapshotOrderbookChannelMessage = `{
    "type": "snapshot",
    "channel": "orderbook",
    "channelId": 1,
    "payload": ${orderbookJsonString}
}`;

export const malformedSnapshotOrderbookChannelMessage = `{
    "type": "snapshot",
    "channel": "orderbook",
    "channelId": 1,
    "payload": {}
}`;
