import { ObjectMap } from '@0x/types';
import * as _ from 'lodash';

import { Actor, Constructor } from './base';

/**
 * Utility function to convert Actors into an object mapping readable names to addresses.
 * Useful for BalanceStore.
 */
export function actorAddressesByName(actors: Actor[]): ObjectMap<string> {
    return _.zipObject(actors.map(actor => actor.name), actors.map(actor => actor.address));
}

/**
 * Filters the given actors by class.
 */
export function filterActorsByRole<TClass extends Constructor>(
    actors: Actor[],
    role: TClass,
): Array<InstanceType<typeof role>> {
    return actors.filter(actor => actor instanceof role) as InstanceType<typeof role>;
}
