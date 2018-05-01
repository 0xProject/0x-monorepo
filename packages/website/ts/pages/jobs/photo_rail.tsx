import * as _ from 'lodash';
import * as React from 'react';

import { FilledImage } from 'ts/pages/jobs/filled_image';

export const PhotoRail = () => {
    const images = ['/images/jobs/office1.png', '/images/jobs/office2.png', '/images/jobs/office3.png'];
    return (
        <div className="clearfix" style={{ height: 491 }}>
            {_.map(images, (image: string) => {
                return (
                    <div key={image} className="col lg-col-4 md-col-4 col-12 center" style={{ height: '100%' }}>
                        <FilledImage src={image} />
                    </div>
                );
            })}
        </div>
    );
};
