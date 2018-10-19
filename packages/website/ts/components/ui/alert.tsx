import { colors } from '@0x/react-shared';
import * as React from 'react';
import { AlertTypes } from 'ts/types';

interface AlertProps {
    type: AlertTypes;
    message: string | React.ReactNode;
}

export const Alert = (props: AlertProps) => {
    const isAlert = props.type === AlertTypes.ERROR;
    const errMsgStyles = {
        background: isAlert ? colors.red200 : colors.lightestGreen,
        color: colors.white,
        marginTop: 10,
        padding: 4,
        paddingLeft: 8,
    };

    return (
        <div className="rounded center" style={errMsgStyles}>
            {props.message}
        </div>
    );
};
