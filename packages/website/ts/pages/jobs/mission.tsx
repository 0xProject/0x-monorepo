import { colors } from '@0xproject/react-shared';

import * as React from 'react';

export const Mission = () => {
    const isSmallScreen = false;
    return (
        <div className="container lg-py4 md-py4 sm-pb4 sm-pt2" style={{ backgroundColor: colors.grey100 }}>
            <div className="mx-auto clearfix">
                {!isSmallScreen && <WorldImage />}
                <div
                    className="col lg-col-6 md-col-6 col-12 center"
                    style={{ color: colors.darkestGrey, height: 364, lineHeight: '364px' }}
                >
                    <div
                        className="mx-auto inline-block lg-align-middle md-align-middle sm-align-top"
                        style={{ maxWidth: 385, lineHeight: '44px', textAlign: 'center' }}
                    >
                        <div className="h2 sm-center sm-pt3" style={{ fontFamily: 'Roboto Mono' }}>
                            Our Mission
                        </div>
                        <div
                            className="pb2 lg-pt2 md-pt2 sm-pt3 sm-px3 h4 sm-center"
                            style={{ fontFamily: 'Roboto', lineHeight: 2, maxWidth: 537 }}
                        >
                            We believe a system can exist in which all world value is accessible to anyone, anywhere,
                            regardless of where you happen to be born.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const WorldImage = () => {
    const isSmallScreen = false;
    return (
        <div className="col lg-col-6 md-col-6 col-12 center">
            <img src="/images/jobs/map.png" height={isSmallScreen ? 280 : 364.5} />
        </div>
    );
};
