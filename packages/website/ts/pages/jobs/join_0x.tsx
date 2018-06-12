import { colors } from '@0xproject/react-shared';

import * as React from 'react';

import { Button } from 'ts/components/ui/button';

const BUTTON_TEXT = 'view open positions';

export interface Join0xProps {
    onCallToActionClick: () => void;
}

export const Join0x = (props: Join0xProps) => (
    <div className="clearfix center lg-py4 md-py4" style={{ backgroundColor: colors.white, color: colors.black }}>
        <div className="mx-auto inline-block align-middle py4" style={{ lineHeight: '44px', textAlign: 'center' }}>
            <div className="h2 sm-center sm-pt3" style={{ fontFamily: 'Roboto Mono' }}>
                Join 0x
            </div>
            <div
                className="pb2 lg-pt2 md-pt2 sm-pt3 sm-px3 h4 sm-center"
                style={{ fontFamily: 'Roboto', lineHeight: 2, maxWidth: 537 }}
            >
                0x is transforming the way that value is exchanged on a global scale. Come join us in San Francisco or
                work remotely anywhere in the world to help create the infrastructure of a new tokenized economy.
            </div>
            <div className="py3">
                <Button
                    type="button"
                    backgroundColor={colors.black}
                    width="290px"
                    fontColor={colors.white}
                    fontSize="18px"
                    fontFamily="Roboto Mono"
                    onClick={props.onCallToActionClick}
                >
                    {BUTTON_TEXT}
                </Button>
            </div>
        </div>
    </div>
);
