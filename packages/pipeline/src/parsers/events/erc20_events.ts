import { ERC20TokenApprovalEventArgs } from '@0x/contract-wrappers';
import { LogWithDecodedArgs } from 'ethereum-types';
import * as R from 'ramda';

import { ERC20ApprovalEvent } from '../../entities';

/**
 * Parses raw event logs for an ERC20 approval event and returns an array of
 * ERC20ApprovalEvent entities.
 * @param eventLogs Raw event logs (e.g. returned from contract-wrappers).
 */
export const parseERC20ApprovalEvents: (
    eventLogs: Array<LogWithDecodedArgs<ERC20TokenApprovalEventArgs>>,
) => ERC20ApprovalEvent[] = R.map(_convertToERC20ApprovalEvent);

/**
 * Converts a raw event log for an ERC20 approval event into an
 * ERC20ApprovalEvent entity.
 * @param eventLog Raw event log (e.g. returned from contract-wrappers).
 */
export function _convertToERC20ApprovalEvent(
    eventLog: LogWithDecodedArgs<ERC20TokenApprovalEventArgs>,
): ERC20ApprovalEvent {
    const erc20ApprovalEvent = new ERC20ApprovalEvent();
    erc20ApprovalEvent.tokenAddress = eventLog.address as string;
    erc20ApprovalEvent.blockNumber = eventLog.blockNumber as number;
    erc20ApprovalEvent.logIndex = eventLog.logIndex as number;
    erc20ApprovalEvent.rawData = eventLog.data as string;
    erc20ApprovalEvent.transactionHash = eventLog.transactionHash;
    erc20ApprovalEvent.ownerAddress = eventLog.args._owner;
    erc20ApprovalEvent.spenderAddress = eventLog.args._spender;
    erc20ApprovalEvent.amount = eventLog.args._value;
    return erc20ApprovalEvent;
}
