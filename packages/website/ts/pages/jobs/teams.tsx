import * as _ from 'lodash';
import * as React from 'react';

import { HeaderItem } from 'ts/pages/jobs/list/header_item';
import { ListItem } from 'ts/pages/jobs/list/list_item';
import { ScreenWidths } from 'ts/types';

const TEAM_ITEM_PROPS_COLUMN1: TeamItemProps[] = [
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
const TEAM_ITEM_PROPS_COLUMN2: TeamItemProps[] = [
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
const MINIMUM_ITEM_HEIGHT = 240;

export interface TeamsProps {
    screenWidth: ScreenWidths;
}

export const Teams = (props: TeamsProps) => (props.screenWidth === ScreenWidths.Sm ? <SmallLayout /> : <LargeLayout />);

const LargeLayout = () => (
    <div className="mx-auto max-width-4 clearfix pb4">
        <div className="col lg-col-6 md-col-6 col-12">
            <HeaderItem headerText={HEADER_TEXT} />
            {_.map(TEAM_ITEM_PROPS_COLUMN1, teamItemProps => React.createElement(TeamItem, teamItemProps))}
        </div>
        <div className="col lg-col-6 md-col-6 col-12">
            <HeaderItem headerText=" " />
            {_.map(TEAM_ITEM_PROPS_COLUMN2, teamItemProps => React.createElement(TeamItem, teamItemProps))}
        </div>
    </div>
);

const SmallLayout = () => (
    <div>
        <HeaderItem headerText={HEADER_TEXT} />
        {_.map(_.concat(TEAM_ITEM_PROPS_COLUMN1, TEAM_ITEM_PROPS_COLUMN2), teamItemProps =>
            React.createElement(TeamItem, teamItemProps),
        )}
    </div>
);

interface TeamItemProps {
    bulletColor: string;
    title: string;
    description: string;
}

export const TeamItem: React.StatelessComponent<TeamItemProps> = ({ bulletColor, title, description }) => {
    return (
        <div style={{ minHeight: MINIMUM_ITEM_HEIGHT }}>
            <ListItem bulletColor={bulletColor}>
                <div style={{ fontWeight: 'bold', fontSize: 16 }}>{title}</div>
            </ListItem>
            <ListItem>
                <div className="pt1" style={{ fontSize: 16, lineHeight: 2 }}>
                    {description}
                </div>
            </ListItem>
        </div>
    );
};
