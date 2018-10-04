import * as _ from 'lodash';

export const cssRuleIfExists = (props: any, rule: string): string => {
    const camelCaseRule = _.camelCase(rule);
    const ruleValueIfExists = props[camelCaseRule];
    if (!_.isUndefined(ruleValueIfExists)) {
        return `${rule}: ${ruleValueIfExists};`;
    }
    return '';
};
