import * as React from 'react';
import styled from 'styled-components';
import { Icon } from 'ts/components/icon';
import { Heading } from 'ts/components/text';
import { Switch } from 'ts/components/ui/switch';
import { ExploreTagButton } from 'ts/pages/explore/explore_tag_button';
import { colors } from 'ts/style/colors';
import { ExploreFilterMetadata, ExploreTilesOrdering, ExploreTilesOrderingMetadata } from 'ts/types';

export const OrderingListWrapper = styled.ul`
    list-style-type: none;
`;

interface OrderingListItemProps {
    active?: boolean;
}

export const OrderingListItem = styled.li<OrderingListItemProps>`
    margin-bottom: 12px;
    cursor: pointer;
    color: ${props => (props.active ? colors.brandLight : colors.grey)};
    transition: color 200ms ease-in-out;
    &:hover {
        color: ${props => (props.active ? colors.brandLight : colors.brandDark)};
    }
`;

interface ExploreSettingsDropdownButtonProps {
    title?: string;
}

export const ExploreSettingsDropdownButton = (props: ExploreSettingsDropdownButtonProps) => {
    return (
        <ExploreTagButton disableHover={true}>
            <SettingsIconWrapper>
                <Icon color={colors.grey} name="settings" size={16} />
            </SettingsIconWrapper>
            {props.title || 'Sort'}
        </ExploreTagButton>
    );
};

const SettingsIconWrapper = styled.div`
    padding-right: 0.4rem;
    display: inline;
    & > * {
        transform: translateY(2px);
    }
`;

export const SettingsWrapper = styled.div`
    position: relative;
    @media (max-width: 64rem) {
        display: none;
    }
    &:hover > div {
        display: block;
        visibility: visible;
        opacity: 1;
        transform: translate3d(0, 0, 0);
        transition: opacity 0.35s, transform 0.35s, visibility 0s;
    }
`;

interface DropdownWrapInterface {
    width?: number;
}

export const DropdownWrap = styled.div<DropdownWrapInterface>`
    width: ${props => props.width || 280}px;
    margin-top: calc(16px - 2rem);
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
    activeOrdering: ExploreTilesOrdering;
    orderings: ExploreTilesOrderingMetadata[];
    onOrdering: (newValue: string) => void;
    onEditorial?: (newValue: boolean) => void;
    editorial?: boolean;
    filters: ExploreFilterMetadata[];
    onFilterClick(filterName: string, active: boolean): void;
}

export class ExploreSettingsDropdown extends React.Component<ExploreSettingsDropdownProps> {
    public render(): React.ReactNode {
        return (
            <>
                <ExploreSettingsFullDropdown {...this.props} />
                <ExploreMobileSettingsDropdown {...this.props} />
            </>
        );
    }
}

const ExploreSettingsFullDropdown = (props: ExploreSettingsDropdownProps) => {
    return (
        <SettingsWrapper>
            <ExploreSettingsDropdownButton />
            <DropdownWrap>
                <DropdownContentWrapper>
                    {!!props.onEditorial && (
                        <div>
                            <Switch isChecked={props.editorial} onToggle={props.onEditorial} label="Editorial" />
                            <Heading asElement="h4" size={14} color="inherit" marginBottom="0" isMuted={0.35}>
                                Editorial content reflects the views of the 0x core team.
                            </Heading>
                        </div>
                    )}
                    <OrderingWrapper>
                        <OrderingListWrapper>
                            {props.orderings.map(o => {
                                const onClick = () => props.onOrdering(o.ordering);
                                return (
                                    <OrderingListItem
                                        onClick={onClick}
                                        active={props.activeOrdering === o.ordering}
                                        key={o.ordering}
                                    >
                                        {o.label}
                                    </OrderingListItem>
                                );
                            })}
                        </OrderingListWrapper>
                    </OrderingWrapper>
                </DropdownContentWrapper>
            </DropdownWrap>
        </SettingsWrapper>
    );
};

export const DropdownContentWrapper = styled.div``;

export const OrderingWrapper = styled.div`
    margin-top: 10px;
    position: relative;
`;

const MobileSettingsWrapper = styled(SettingsWrapper)`
    display: none;
    @media (max-width: 64rem) {
        display: block;
        padding-bottom: 1rem;
    }
    @media (max-width: 36rem) {
        & > button {
            width: 100%;
        }
    }
`;

const MobileDropdownWrap = styled(DropdownWrap)`
    margin-top: 0;
    @media (max-width: 36rem) {
        width: 100%;
        left: 0;
        &:after,
        &:before {
            left: 50%;
        }
    }
`;

interface ExploreMobileSettingsDropdownProps extends ExploreSettingsDropdownProps {
    filters: ExploreFilterMetadata[];
    onFilterClick(filterName: string, active: boolean): void;
}

export const ExploreMobileSettingsDropdown = (props: ExploreMobileSettingsDropdownProps) => {
    return (
        <MobileSettingsWrapper>
            <ExploreSettingsDropdownButton title="Filter + Sort" />
            <MobileDropdownWrap>
                <DropdownContentWrapper>
                    <OrderingWrapper>
                        <Heading asElement="h4" size={14} color="inherit" marginBottom="16px" isMuted={0.35}>
                            Filter
                        </Heading>
                        <OrderingListWrapper>
                            {props.filters.map(f => {
                                const onClick = () => props.onFilterClick(f.name, !f.active);
                                return (
                                    <OrderingListItem onClick={onClick} active={f.active} key={f.name}>
                                        {f.label}
                                    </OrderingListItem>
                                );
                            })}
                        </OrderingListWrapper>
                    </OrderingWrapper>
                    <BottomOrderingWrapper>
                        <Heading asElement="h4" size={14} color="inherit" marginBottom="16px" isMuted={0.35}>
                            Sort
                        </Heading>
                        <OrderingListWrapper>
                            {props.orderings.map(o => {
                                const onClick = () => props.onOrdering(o.ordering);
                                return (
                                    <OrderingListItem
                                        onClick={onClick}
                                        active={props.activeOrdering === o.ordering}
                                        key={o.ordering}
                                    >
                                        {o.label}
                                    </OrderingListItem>
                                );
                            })}
                        </OrderingListWrapper>
                    </BottomOrderingWrapper>
                </DropdownContentWrapper>
            </MobileDropdownWrap>
        </MobileSettingsWrapper>
    );
};

const BottomOrderingWrapper = styled(OrderingWrapper)`
    margin-top: 20px;
    padding-top: 20px;
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
