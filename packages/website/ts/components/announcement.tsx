import * as React from 'react';
import styled from 'styled-components';

import { colors } from '../style/colors';

import { Link } from './link';
import { Paragraph } from './text';

export interface AnnouncementProps {
    headline: string;
    href: string;
}

const BrandColorSpan = styled.span`
    color: ${colors.white};
    padding-right: 12px;
`;

const Wrap = styled.div`
    padding: 20px 0;
    color: ${colors.brandLight};
`;

export const Announcement: React.StatelessComponent<AnnouncementProps> = (props: AnnouncementProps) => {
    return (<Wrap>
        <Link href={props.href}>
            <BrandColorSpan>{'New!'}</BrandColorSpan>
            {props.headline}
        </Link>
    </Wrap>);
};
