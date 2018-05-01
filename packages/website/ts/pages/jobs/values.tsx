import { colors } from '@0xproject/react-shared';
import * as _ from 'lodash';
import * as React from 'react';

import { BulletedItem, BulletedItemProps } from 'ts/pages/jobs/bulleted_item';

const ITEMS_COLUMN1: BulletedItemProps[] = [
    {
        bulletColor: '#6FCF97',
        title: 'Ethics/Doing the right thing',
        description:
            'orem ipsum dolor sit amet, consectetur adipiscing elit. Sed ante vitae lacus condimentum auctor nec ut elit.',
    },
    {
        bulletColor: '#56CCF2',
        title: 'Clear communication',
        description:
            'orem ipsum dolor sit amet, consectetur adipiscing elit. Sed ante vitae lacus condimentum auctor nec ut elit.',
    },
    {
        bulletColor: '#EB5757',
        title: 'Grow the whole pie',
        description:
            'orem ipsum dolor sit amet, consectetur adipiscing elit. Sed ante vitae lacus condimentum auctor nec ut elit.',
    },
];
const ITEMS_COLUMN2: BulletedItemProps[] = [
    {
        bulletColor: '#F2994A',
        title: 'Crypto-Economic Technology',
        description:
            'orem ipsum dolor sit amet, consectetur adipiscing elit. Sed ante vitae lacus condimentum auctor nec ut elit.',
    },
    {
        bulletColor: '#E0E0E0',
        title: 'Transparency',
        description:
            'orem ipsum dolor sit amet, consectetur adipiscing elit. Sed ante vitae lacus condimentum auctor nec ut elit.',
    },
    {
        bulletColor: '#F2C94C',
        title: 'Positive Energy',
        description:
            'orem ipsum dolor sit amet, consectetur adipiscing elit. Sed ante vitae lacus condimentum auctor nec ut elit.',
    },
];

export const Values = () => {
    const isSmallScreen = false;
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
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
