import * as React from 'react';

import { FilledImage } from 'ts/pages/jobs/filled_image';

export const Benefits = () => (
    <div className="flex" style={{ height: 937 }}>
        <div style={{ width: '43%', height: '100%' }}>
            <div className="flex" style={{ height: '67%' }}>
                <FilledImage src="/images/jobs/location1.png" />
            </div>
            <div className="clearfix" style={{ height: '33%' }}>
                <div className="col lg-col-6 md-col-6 col-12" style={{ height: '100%' }}>
                    <FilledImage src="/images/jobs/location2.png" />
                </div>
                <div className="col lg-col-6 md-col-6 col-12" style={{ height: '100%' }}>
                    <FilledImage src="/images/jobs/location3.png" />
                </div>
            </div>
        </div>
        <div style={{ width: '57%', height: '100%' }} />
    </div>
);
