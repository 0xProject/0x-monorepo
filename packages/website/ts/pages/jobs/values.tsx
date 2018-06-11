import { colors } from '@0xproject/react-shared';
import * as _ from 'lodash';
import * as React from 'react';

import { BulletedItem, BulletedItemProps } from 'ts/pages/jobs/bulleted_item';

const BULLETED_ITEMS: BulletedItemProps[] = [
    {
        bulletColor: '#6FCF97',
        title: 'Ethics/Doing the right thing',
        description: 'orem ipsum dolor sit amet, consectetur adipiscing elit.',
    },
    {
        bulletColor: '#56CCF2',
        title: 'Consistently ship',
        description: 'orem ipsum dolor sit amet, consectetur adipiscing elit.',
    },
    {
        bulletColor: '#EB5757',
        title: 'Focus on long term impact',
        description: 'orem ipsum dolor sit amet, consectetur adipiscing elit.',
    },
];

export const Values = () => {
    const isSmallScreen = false;
    return (
        <div className="clearfix" style={{ backgroundColor: colors.white }}>
            <div className="mx-auto max-width-4 clearfix">
                <div className="h2 lg-py4 md-py4 sm-py3" style={{ paddingLeft: 90, fontFamily: 'Roboto Mono' }}>
                    Our Values
                </div>
                <div className="col col-12 px2">
                    {_.map(BULLETED_ITEMS, bulletedItemProps => {
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
