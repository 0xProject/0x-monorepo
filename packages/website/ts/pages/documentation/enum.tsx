import * as _ from 'lodash';
import * as React from 'react';
import {EnumValue, TypeDocNode} from 'ts/types';
import {utils} from 'ts/utils/utils';

const STRING_ENUM_CODE_PREFIX = ' strEnum(';

interface EnumProps {
    values: EnumValue[];
}

export function Enum(props: EnumProps) {
    const values = _.map(props.values, (value, i) => {
        const isLast = i === props.values.length - 1;
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
}
