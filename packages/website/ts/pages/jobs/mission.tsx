import * as React from 'react';

import { FilledImage } from 'ts/pages/jobs/filled_image';
import { colors } from 'ts/style/colors';
import { ScreenWidths } from 'ts/types';

export interface MissionProps {
    screenWidth: ScreenWidths;
}
export const Mission = (props: MissionProps) => {
    const isSmallScreen = props.screenWidth === ScreenWidths.Sm;
    const image = (
        <div className="col lg-col-6 md-col-6 col-12 sm-py2 px2 center">
            <img src="/images/jobs/map.png" style={{ width: '100%' }} />
        </div>
    );
    const missionStatementStyle = !isSmallScreen ? { height: 364, lineHeight: '364px' } : undefined;
    const missionStatement = (
        <div className="col lg-col-6 md-col-6 col-12 center" style={missionStatementStyle}>
            <div
                className="mx-auto inline-block align-middle"
                style={{ maxWidth: 385, lineHeight: '44px', textAlign: 'center' }}
            >
                <div className="h2 sm-center sm-pt3" style={{ fontFamily: 'Roboto Mono' }}>
                    Our Mission
                </div>
                <div
                    className="pb2 lg-pt2 md-pt2 sm-pt3 sm-px3 h4 sm-center"
                    style={{ fontFamily: 'Roboto', lineHeight: 2, maxWidth: 537 }}
                >
                    We believe a system can exist in which all world value is accessible to anyone, anywhere, regardless
                    of where you happen to be born.
                </div>
            </div>
        </div>
    );
    return (
        <div className="container lg-py4 md-py4" style={{ backgroundColor: colors.jobsPageGrey, color: colors.black }}>
            <div className="mx-auto clearfix sm-py4">
                {isSmallScreen ? (
                    <div>
                        {missionStatement}
                        {image}
                    </div>
                ) : (
                    <div>
                        {image}
                        {missionStatement}
                    </div>
                )}
            </div>
        </div>
    );
};
