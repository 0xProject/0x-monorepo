import { colors } from '@0xproject/react-shared';
import * as _ from 'lodash';
import * as React from 'react';

import { BulletedItemInfo, BulletedItemList } from 'ts/pages/jobs/bulleted_item_list';
import { ScreenWidths } from 'ts/types';

const ITEMS_COLUMN1: BulletedItemInfo[] = [
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
const ITEMS_COLUMN2: BulletedItemInfo[] = [
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
const HEADER_TEXT = 'Our Teams';

export interface TeamsProps {
    screenWidth: ScreenWidths;
}

export const Teams = (props: TeamsProps) => (props.screenWidth === ScreenWidths.Sm ? <SmallLayout /> : <LargeLayout />);

const LargeLayout = () => (
    <div className="mx-auto max-width-4 clearfix">
        <div className="col lg-col-6 md-col-6 col-12">
            <BulletedItemList headerText={HEADER_TEXT} bulletedItemInfos={ITEMS_COLUMN1} />
        </div>
        <div className="col lg-col-6 md-col-6 col-12">
            <BulletedItemList headerText=" " bulletedItemInfos={ITEMS_COLUMN2} />
        </div>
    </div>
);

const SmallLayout = () => (
    <BulletedItemList headerText={HEADER_TEXT} bulletedItemInfos={_.concat(ITEMS_COLUMN1, ITEMS_COLUMN2)} />
);
