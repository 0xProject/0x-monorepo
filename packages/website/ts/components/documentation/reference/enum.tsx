import * as _ from 'lodash';
import * as React from 'react';

import { EnumValue } from 'ts/types';

export interface EnumProps {
    values: EnumValue[];
}

export const Enum = (props: EnumProps) => {
    const values = _.map(props.values, value => {
        const defaultValueIfAny = value.defaultValue !== undefined ? ` = ${value.defaultValue}` : '';
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
