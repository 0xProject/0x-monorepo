import * as _ from 'lodash';
import * as React from 'react';

import { FilledImage } from 'ts/components/ui/filled_image';
import { FloatingImage } from 'ts/pages/jobs/floating_image';
import { HeaderItem } from 'ts/pages/jobs/list/header_item';
import { ListItem } from 'ts/pages/jobs/list/list_item';
import { colors } from 'ts/style/colors';
import { ScreenWidths } from 'ts/types';

const IMAGE_PATHS = ['/images/jobs/location1.png', '/images/jobs/location2.png', '/images/jobs/location3.png'];
const BENEFIT_ITEM_PROPS_LIST: BenefitItemProps[] = [
    {
        bulletColor: '#6FCF97',
        description:
            'Donec eget auctor mauris, a imperdiet ante. Ut a tellus ullamcorper, pharetra nibh sed, dignissim mauris. Quisque vel magna vitae nisi scelerisque commodo sed eget dolor. Maecenas vehicula orci',
    },
    {
        bulletColor: '#56CCF2',
        description:
            'Donec eget auctor mauris, a imperdiet ante. Ut a tellus ullamcorper, pharetra nibh sed, dignissim mauris. Quisque vel magna vitae nisi scelerisque commodo sed eget dolor. Maecenas vehicula orci',
    },
    {
        bulletColor: '#EB5757',
        description:
            'Donec eget auctor mauris, a imperdiet ante. Ut a tellus ullamcorper, pharetra nibh sed, dignissim mauris. Quisque vel magna vitae nisi scelerisque commodo sed eget dolor. Maecenas vehicula orci',
    },
    {
        bulletColor: '#6FCF97',
        description:
            'Donec eget auctor mauris, a imperdiet ante. Ut a tellus ullamcorper, pharetra nibh sed, dignissim mauris. Quisque vel magna vitae nisi scelerisque commodo sed eget dolor. Maecenas vehicula orci',
    },
    {
        bulletColor: '#56CCF2',
        description:
            'Donec eget auctor mauris, a imperdiet ante. Ut a tellus ullamcorper, pharetra nibh sed, dignissim mauris. Quisque vel magna vitae nisi scelerisque commodo sed eget dolor. Maecenas vehicula orci',
    },
];
const LARGE_LAYOUT_HEIGHT = 937;
const LARGE_LAYOUT_BENEFITS_LIST_PADDING_LEFT = 205;
const HEADER_TEXT = 'Benefits';
const BENEFIT_ITEM_MIN_HEIGHT = 150;

export interface BenefitsProps {
    screenWidth: ScreenWidths;
}

export const Benefits = (props: BenefitsProps) => (
    <div style={{ backgroundColor: colors.jobsPageBackground }}>
        {props.screenWidth === ScreenWidths.Sm ? <SmallLayout /> : <LargeLayout />}
    </div>
);

const LargeLayout = () => (
    <div className="flex" style={{ height: LARGE_LAYOUT_HEIGHT }}>
        <div style={{ width: '43%', height: '100%' }}>
            <ImageGrid />
        </div>
        <div
            className="pr4"
            style={{ paddingLeft: LARGE_LAYOUT_BENEFITS_LIST_PADDING_LEFT, width: '57%', height: '100%' }}
        >
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

export const BenefitsList = () => {
    return (
        <div>
            <HeaderItem headerText={HEADER_TEXT} />
            {_.map(BENEFIT_ITEM_PROPS_LIST, valueItemProps => React.createElement(BenefitItem, valueItemProps))}
        </div>
    );
};
interface BenefitItemProps {
    bulletColor: string;
    description: string;
}

const BenefitItem: React.StatelessComponent<BenefitItemProps> = ({ bulletColor, description }) => (
    <div style={{ minHeight: BENEFIT_ITEM_MIN_HEIGHT }}>
        <ListItem bulletColor={bulletColor}>
            <div style={{ fontSize: 16, lineHeight: 1.5 }}>{description}</div>
        </ListItem>
    </div>
);

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
