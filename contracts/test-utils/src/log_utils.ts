import { LogEntry, LogWithDecodedArgs, TransactionReceiptWithDecodedLogs } from 'ethereum-types';

import { expect } from './chai_setup';

// tslint:disable no-unnecessary-type-assertion

/**
 * Filter logs by event name/type.
 */
export function filterLogs<TEventArgs>(logs: LogEntry[], event: string): Array<LogWithDecodedArgs<TEventArgs>> {
    return (logs as Array<LogWithDecodedArgs<any>>).filter(log => log.event === event);
}

/**
 * Filter logs by event name/type and convert to arguments.
 */
export function filterLogsToArguments<TEventArgs>(logs: LogEntry[], event: string): TEventArgs[] {
    return filterLogs<TEventArgs>(logs, event).map(log => log.args);
}

/**
 * Verifies that a transaction emitted the expected events of a particular type.
 */
export function verifyEvents<TEventArgs>(
    txReceipt: TransactionReceiptWithDecodedLogs,
    expectedEvents: TEventArgs[],
    eventName: string,
): void {
    const logs = filterLogsToArguments<TEventArgs>(txReceipt.logs, eventName);
    expect(logs.length).to.eq(expectedEvents.length);
    logs.forEach((log, index) => {
        expect(log).to.deep.equal(expectedEvents[index]);
    });
}

/**
 * Given a collection of logs, verifies that matching events are identical.
 */
export function verifyEventsFromLogs<TEventArgs>(
    logs: LogEntry[],
    expectedEvents: TEventArgs[],
    eventName: string,
): void {
    const _logs = filterLogsToArguments<TEventArgs>(logs, eventName);
    expect(_logs.length).to.eq(expectedEvents.length);
    _logs.forEach((log, index) => {
        expect(log).to.deep.equal(expectedEvents[index]);
    });
}
