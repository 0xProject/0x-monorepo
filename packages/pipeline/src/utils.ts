import * as _ from 'lodash';
import { logToEventSchemaMapping } from './models/event';

export const typeConverters = {
    convertLogEventToEventObject(log: any): any {
        const newEvent: any = {};
        for (const key in logToEventSchemaMapping) {
            if (_.get(log, key)) {
                newEvent[logToEventSchemaMapping[key]] = _.get(log, key);
                if (newEvent[logToEventSchemaMapping[key]].constructor.name === 'BigNumber') {
                    newEvent[logToEventSchemaMapping[key]] = newEvent[logToEventSchemaMapping[key]].toString();
                }
            }
        }
        return newEvent;
    },
};

export const formatters = {
    escapeSQLParams(params: any[]): string {
        let escapedString = '';
        for (const i in params) {
            escapedString += "'" + params[i] + "',";
        }
        return escapedString.slice(0, -1);
    },
};
