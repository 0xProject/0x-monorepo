import * as React from 'react';
import styled from 'styled-components';

import { colors } from '../style/colors';

import { Button } from './button';

export interface AnnouncementProps {
    headline: string;
    href: string;
    shouldOpenInNewTab?: boolean;
}

const BrandColorSpan = styled.span`
    color: ${colors.white};
    padding-right: 9px;
`;

const Wrap = styled.div`
    padding: 20px 0 56px 0;
    color: ${colors.brandLight};
`;

const AnnouncementLink = styled(Button)`
    @media (max-width: 500px) {
        && {
            white-space: pre-wrap;
            line-height: 1.3;
        }
    }
`;
export const Announcement: React.StatelessComponent<AnnouncementProps> = (props: AnnouncementProps) => {
    return (
        <Wrap>
            <AnnouncementLink
                isWithArrow={true}
                isAccentColor={true}
                href={props.href}
                target={props.shouldOpenInNewTab ? '_blank' : ''}
            >
                <BrandColorSpan>{'New!'}</BrandColorSpan>
                {props.headline}
            </AnnouncementLink>
        </Wrap>
    );
};
