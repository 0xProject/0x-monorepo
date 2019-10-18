import { Actor } from './base';
import { MakerMixin } from './maker';
import { PoolOperatorMixin } from './pool_operator';

export const OperatorMaker = PoolOperatorMixin(MakerMixin(Actor));
