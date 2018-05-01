import { colors } from '@0xproject/react-shared';

import FlatButton from 'material-ui/FlatButton';
import * as React from 'react';

export const Join0x = () => (
    <div className="clearfix center py4" style={{ backgroundColor: colors.white, color: colors.black }}>
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
                <FlatButton
                    label={'view open positions'}
                    backgroundColor={colors.black}
                    labelStyle={{
                        fontSize: 18,
                        fontFamily: 'Roboto Mono',
                        fontWeight: 'lighter',
                        color: colors.white,
                        textTransform: 'lowercase',
                    }}
                    style={{ width: 280, height: 62, borderRadius: 5 }}
                />
            </div>
        </div>
    </div>
);
