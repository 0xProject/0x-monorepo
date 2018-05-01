import { colors } from '@0xproject/react-shared';
import * as _ from 'lodash';
import * as React from 'react';

import { BulletedItem, BulletedItemProps } from 'ts/pages/jobs/bulleted_item';

const ITEMS_COLUMN1: BulletedItemProps[] = [
    {
        bulletColor: '#EB5757',
        title: 'User Growth',
        description:
            'Donec eget auctor mauris, a imperdiet ante. Ut a tellus ullamcorper, pharetra nibh sed, dignissim mauris. Quisque vel magna vitae nisi scelerisque commodo sed eget dolor. Maecenas vehicula orci',
    },
    {
        bulletColor: '#EB5757',
        title: 'Governance',
        description:
            'Donec eget auctor mauris, a imperdiet ante. Ut a tellus ullamcorper, pharetra nibh sed, dignissim mauris. Quisque vel magna vitae nisi scelerisque commodo sed eget dolor. Maecenas vehicula orci',
    },
];
const ITEMS_COLUMN2: BulletedItemProps[] = [
    {
        bulletColor: '#EB5757',
        title: 'Developer Tools',
        description:
            'Donec eget auctor mauris, a imperdiet ante. Ut a tellus ullamcorper, pharetra nibh sed, dignissim mauris. Quisque vel magna vitae nisi scelerisque commodo sed eget dolor. Maecenas vehicula orci',
    },
    {
        bulletColor: '#EB5757',
        title: 'Marketing',
        description:
            'Donec eget auctor mauris, a imperdiet ante. Ut a tellus ullamcorper, pharetra nibh sed, dignissim mauris. Quisque vel magna vitae nisi scelerisque commodo sed eget dolor. Maecenas vehicula orci',
    },
];

export const Teams = () => {
    const isSmallScreen = false;
    const teamHeight = 220;
    return (
        <div className="clearfix lg-py4 md-py4 sm-pb4 sm-pt2" style={{ backgroundColor: colors.white }}>
            <div className="mx-auto max-width-4 clearfix">
                <div className="col lg-col-6 md-col-6 col-12 p2">
                    {_.map(ITEMS_COLUMN1, bulletedItemProps => {
                        return (
                            <BulletedItem
                                bulletColor={bulletedItemProps.bulletColor}
                                title={bulletedItemProps.title}
                                description={bulletedItemProps.description}
                                height={teamHeight}
                            />
                        );
                    })}
                </div>
                <div className="col lg-col-6 md-col-6 col-12 p2">
                    {_.map(ITEMS_COLUMN2, bulletedItemProps => {
                        return (
                            <BulletedItem
                                bulletColor={bulletedItemProps.bulletColor}
                                title={bulletedItemProps.title}
                                description={bulletedItemProps.description}
                                height={teamHeight}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
