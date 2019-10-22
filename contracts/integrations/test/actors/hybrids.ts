import { Actor } from './base';
import { MakerMixin } from './maker';
import { PoolOperatorMixin } from './pool_operator';

export class OperatorMaker extends PoolOperatorMixin(MakerMixin(Actor)) {}
