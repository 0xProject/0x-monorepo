import * as _ from 'lodash';
import * as React from 'react';

import { EnumValue } from '../types';

export interface EnumProps {
    values: EnumValue[];
}

export const Enum = (props: EnumProps) => {
    const values = _.map(props.values, (value, i) => {
        const defaultValueIfAny = !_.isUndefined(value.defaultValue) ? ` = ${value.defaultValue}` : '';
        return `\n\t${value.name}${defaultValueIfAny},`;
    });
    return (
        <span>
            {`{`}
            {values}
            <br />
            {`}`}
        </span>
    );
};
