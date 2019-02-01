import * as React from 'react';

import { Button } from 'ts/components/ui/button';
import { colors } from 'ts/style/colors';

const BUTTON_TEXT = 'reload';

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
                <Button
                    type="button"
                    backgroundColor={colors.black}
                    width="290px"
                    fontColor={colors.white}
                    fontSize="18px"
                    fontFamily="Roboto Mono"
                    onClick={props.onRetry}
                >
                    {BUTTON_TEXT}
                </Button>
            </div>
        </div>
    </div>
);
