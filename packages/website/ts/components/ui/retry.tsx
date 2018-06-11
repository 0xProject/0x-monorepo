import FlatButton from 'material-ui/FlatButton';
import { GridList } from 'material-ui/GridList';
import * as React from 'react';

import { colors } from 'ts/style/colors';

export interface RetryProps {
    onRetry: () => void;
}
export const Retry = (props: RetryProps) => (
    <div className="clearfix center" style={{ color: colors.black }}>
        <div className="mx-auto inline-block align-middle" style={{ lineHeight: '44px', textAlign: 'center' }}>
            <div className="h2" style={{ fontFamily: 'Roboto Mono' }}>
                Something went wrong.
            </div>
            <div className="py3">
                <FlatButton
                    label={'reload'}
                    backgroundColor={colors.black}
                    labelStyle={{
                        fontSize: 18,
                        fontFamily: 'Roboto Mono',
                        fontWeight: 'lighter',
                        color: colors.white,
                        textTransform: 'lowercase',
                    }}
                    style={{ width: 280, height: 62, borderRadius: 5 }}
                    onClick={props.onRetry}
                />
            </div>
        </div>
    </div>
);
