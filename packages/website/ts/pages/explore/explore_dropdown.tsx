import * as React from 'react';
import styled from 'styled-components';

import { Icon } from 'ts/components/icon';
import { Heading, Paragraph } from 'ts/components/text';
import { Switch } from 'ts/components/ui/switch';
import { Button as ExploreTagButton } from 'ts/pages/explore/explore_tag_button';
import { colors } from 'ts/style/colors';

const ExploreSettingsDropdownButton = ({}) => {
    return <ExploreTagButton disableHover={true}>
        <SettingsIconWrapper>
            <Icon color={colors.grey} name="settings" size={16} />
        </SettingsIconWrapper>
        Settings
    </ExploreTagButton>;
};

const SettingsIconWrapper = styled.div`
    padding-right: 0.4rem;
    display: inline;
    & > * {
        transform: translateY(2px);
    }
`;

const SettingsWrapper = styled.div`
    position: relative;

    @media (min-width: 800px) {
        &:hover > div {
            display: block;
            visibility: visible;
            opacity: 1;
            transform: translate3d(0, 0, 0);
            transition: opacity 0.35s, transform 0.35s, visibility 0s;
        }
    }
`;

interface DropdownWrapInterface {
    width?: number;
}

const DropdownWrap = styled.div<DropdownWrapInterface>`
    width: ${props => props.width || 280}px;
    margin-top: 16px;
    padding: 16px 24px;
    border: 1px solid transparent;
    border-color: ${props => props.theme.dropdownBorderColor};
    background-color: ${props => props.theme.dropdownBg};
    color: ${props => props.theme.dropdownColor};
    position: absolute;
    top: 100%;
    right: 0%;
    visibility: hidden;
    opacity: 0;
    transform: translate3d(0, -10px, 0);
    transition: opacity 0.35s, transform 0.35s, visibility 0s 0.35s;
    z-index: 20;

    &:after,
    &:before {
        bottom: 100%;
        left: 90%;
        border: solid transparent;
        content: ' ';
        height: 0;
        width: 0;
        position: absolute;
        pointer-events: none;
    }
    &:after {
        border-color: rgba(255, 255, 255, 0);
        border-bottom-color: ${props => props.theme.dropdownBg};
        border-width: 10px;
        margin-left: -10px;
    }
    &:before {
        border-color: rgba(255, 0, 0, 0);
        border-bottom-color: ${props => props.theme.dropdownBorderColor};
        border-width: 11px;
        margin-left: -11px;
    }

    @media (max-width: 768px) {
        display: none;
    }
`;

export interface ExploreSettingsDropdownProps {
    orderings: string[];
}

export class ExploreSettingsDropdown extends React.Component<ExploreSettingsDropdownProps> {
    constructor(props: ExploreSettingsDropdownProps) {
        super(props);
    }

    public render(): React.ReactNode {
        return <SettingsWrapper>
            <ExploreSettingsDropdownButton/>
            <DropdownWrap>
                <DropdownContent orderings={this.props.orderings}/>
            </DropdownWrap>
        </SettingsWrapper>;
    }
}

const DropdownContentWrapper = styled.div`
`;

const OrderingWrapper = styled.div`
    padding-top: 20px;
    margin-top: 20px;
    margin-bottom: 20px;
    position: relative;

    &:before {
        content: '';
        width: 100%;
        height: 1px;
        background-color: ${props => props.theme.dropdownColor};
        opacity: 0.15;
        position: absolute;
        top: 0;
        left: 0;
    }
`;

interface DropdownContentProps {
    orderings: string[];
}

const DropdownContent = (props: DropdownContentProps) => {
    return <DropdownContentWrapper>
        <div>
            <Switch label="Editorial"/>
            <Heading asElement="h4" size={14} color="inherit" marginBottom="0" isMuted={0.35}>
                Editorial content reflects the views of the 0x core team.
            </Heading>
        </div>
        <OrderingWrapper>
            <Heading asElement="h4" size={14} color="inherit" marginBottom="16px" isMuted={0.35}>
                Ordering
            </Heading>
            {props.orderings.map(o => {
                return <Paragraph marginBottom="12px" key={o}>{o}</Paragraph>;
            })}
        </OrderingWrapper>
    </DropdownContentWrapper>;
};
