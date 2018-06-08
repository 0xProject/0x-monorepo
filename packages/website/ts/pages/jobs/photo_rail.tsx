import * as _ from 'lodash';
import * as React from 'react';

import { FilledImage } from 'ts/pages/jobs/filled_image';
import { ScreenWidths } from 'ts/types';

const IMAGE_PATHS = ['/images/jobs/office1.png', '/images/jobs/office2.png', '/images/jobs/office3.png'];

export interface PhotoRailProps {
    images: string[];
}

export const PhotoRail = (props: PhotoRailProps) => {
    return (
        <div className="clearfix" style={{ height: 490 }}>
            {_.map(props.images, (image: string) => {
                return (
                    <div key={image} className="col lg-col-4 md-col-4 col-12 center" style={{ height: '100%' }}>
                        <FilledImage src={image} />
                    </div>
                );
            })}
        </div>
    );
};
