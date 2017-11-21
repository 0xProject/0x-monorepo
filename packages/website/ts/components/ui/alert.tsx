import * as React from 'react';
import {colors} from 'material-ui/styles';
import {AlertTypes} from 'ts/types';

const CUSTOM_GREEN = 'rgb(137, 199, 116)';

interface AlertProps {
    type: AlertTypes;
    message: string|React.ReactNode;
}

export function Alert(props: AlertProps) {
    const isAlert = props.type === AlertTypes.ERROR;
    const errMsgStyles = {
        background: isAlert ? colors.red200 : CUSTOM_GREEN,
        color: 'white',
        marginTop: 10,
        padding: 4,
        paddingLeft: 8,
    };

    return (
        <div className="rounded center" style={errMsgStyles}>
            {props.message}
        </div>
    );
}
