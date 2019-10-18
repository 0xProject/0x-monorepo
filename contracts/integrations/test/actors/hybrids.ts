import { Actor } from './base';
import { Maker } from './maker';
import { PoolOperator } from './pool_operator';

export const OperatorAndMaker = PoolOperator(Maker(Actor));
