import * as _ from 'lodash';
import * as React from 'react';

import { BulletedItemInfo, BulletedItemList } from 'ts/pages/jobs/bulleted_item_list';
import { FilledImage } from 'ts/pages/jobs/filled_image';
import { FloatingImage } from 'ts/pages/jobs/floating_image';
import { colors } from 'ts/style/colors';
import { ScreenWidths } from 'ts/types';

const IMAGE_PATHS = ['/images/jobs/location1.png', '/images/jobs/location2.png', '/images/jobs/location3.png'];
const BULLETED_ITEM_INFOS: BulletedItemInfo[] = [
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
    {
        bulletColor: '#6FCF97',
        title: 'Test test yo',
        description: 'orem ipsum dolor sit amet, consectetur adipiscing elit.',
    },
    {
        bulletColor: '#56CCF2',
        title: 'Waddle Waddle',
        description: 'orem ipsum dolor sit amet, consectetur adipiscing elit.',
    },
];

export interface BenefitsProps {
    screenWidth: ScreenWidths;
}

export const Benefits = (props: BenefitsProps) => (
    <div style={{ backgroundColor: colors.jobsPageGrey }}>
        {props.screenWidth === ScreenWidths.Sm ? <SmallLayout /> : <LargeLayout />}
    </div>
);

const LargeLayout = () => (
    <div className="flex" style={{ height: 937 }}>
        <div style={{ width: '43%', height: '100%' }}>
            <ImageGrid />
        </div>
        <div style={{ paddingLeft: 205, width: '57%', height: '100%' }}>
            <BenefitsList />
        </div>
    </div>
);

const SmallLayout = () => (
    <div>
        <FloatingImage src={_.head(IMAGE_PATHS)} />
        <BenefitsList />
    </div>
);

const BenefitsList = () => <BulletedItemList headerText="Benefits" bulletedItemInfos={BULLETED_ITEM_INFOS} />;

const ImageGrid = () => (
    <div style={{ width: '100%', height: '100%' }}>
        <div className="flex" style={{ height: '67%' }}>
            <FilledImage src={IMAGE_PATHS[0]} />
        </div>
        <div className="clearfix" style={{ height: '33%' }}>
            <div className="col lg-col-6 md-col-6 col-12" style={{ height: '100%' }}>
                <FilledImage src={IMAGE_PATHS[1]} />
            </div>
            <div className="col lg-col-6 md-col-6 col-12" style={{ height: '100%' }}>
                <FilledImage src={IMAGE_PATHS[2]} />
            </div>
        </div>
    </div>
);
