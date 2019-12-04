import { Actor } from './base';
import { KeeperMixin } from './keeper';
import { MakerMixin } from './maker';
import { PoolOperatorMixin } from './pool_operator';
import { StakerMixin } from './staker';
import { TakerMixin } from './taker';

export class OperatorMaker extends PoolOperatorMixin(MakerMixin(Actor)) {}
export class StakerMaker extends StakerMixin(MakerMixin(Actor)) {}
export class StakerOperator extends StakerMixin(PoolOperatorMixin(Actor)) {}
export class OperatorStakerMaker extends PoolOperatorMixin(StakerMixin(MakerMixin(Actor))) {}
export class StakerKeeper extends StakerMixin(KeeperMixin(Actor)) {}
export class MakerTaker extends MakerMixin(TakerMixin(Actor)) {}
