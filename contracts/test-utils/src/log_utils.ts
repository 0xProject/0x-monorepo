import { LogEntry, LogWithDecodedArgs } from 'ethereum-types';

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
