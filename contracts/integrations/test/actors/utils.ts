import { TokenOwnersByName } from '@0x/contracts-exchange';
import * as _ from 'lodash';

import { Actor } from './base';

export function actorAddressesByName(actors: Actor[]): TokenOwnersByName {
    return _.zipObject(actors.map(actor => actor.name), actors.map(actor => actor.address));
}
