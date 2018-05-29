import { assert as sharedAssert } from '@0xproject/assert';
// HACK: We need those two unused imports because they're actually used by sharedAssert which gets injected here
// tslint:disable-next-line:no-unused-variable
import { Schema, schemas } from '@0xproject/json-schemas';
// tslint:disable-next-line:no-unused-variable
import { ECSignature } from '@0xproject/types';
import { BigNumber } from '@0xproject/utils';
import * as _ from 'lodash';

export const assert = {
    ...sharedAssert,
    isOrderbookChannelSubscriptionOpts(variableName: string, subscriptionOpts: any): void {
        sharedAssert.doesConformToSchema(
            'subscriptionOpts',
            subscriptionOpts,
            schemas.relayerApiOrderbookChannelSubscribePayload,
        );
    },
    isOrderbookChannelHandler(variableName: string, handler: any): void {
        sharedAssert.isFunction(`${variableName}.onSnapshot`, _.get(handler, 'onSnapshot'));
        sharedAssert.isFunction(`${variableName}.onUpdate`, _.get(handler, 'onUpdate'));
        sharedAssert.isFunction(`${variableName}.onError`, _.get(handler, 'onError'));
        sharedAssert.isFunction(`${variableName}.onClose`, _.get(handler, 'onClose'));
    },
};
