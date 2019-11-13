import { ObjectMap } from '@0x/types';
import * as _ from 'lodash';

import { Actor } from './base';

/**
 * Utility function to convert Actors into an object mapping readable names to addresses.
 * Useful for BalanceStore.
 */
export function actorAddressesByName(actors: Actor[]): ObjectMap<string> {
    return _.zipObject(actors.map(actor => actor.name), actors.map(actor => actor.address));
}
