import React from 'react';
import styled from 'styled-components';

import { Link } from 'ts/components/documentation/shared/link';

import { colors } from 'ts/style/colors';
import { docs } from 'ts/style/docs';

import { SidebarWrapper } from 'ts/components/docs/sidebar/sidebar_wrapper';
import { VersionPicker } from 'ts/components/docs/sidebar/version_picker';

interface ITableOfContentsProps {
    contents: IContents[];
    versions?: string[];
}

export interface IContents {
    children: IContents[];
    id: string;
    level: number;
    title: string;
}

export interface ISelectItemConfig {
    label: string;
    value?: string;
    onClick?: () => void;
}

export const TableOfContents: React.FC<ITableOfContentsProps> = ({ contents, versions }) => {
    return (
        <SidebarWrapper>
            {versions && <VersionPicker versions={versions} />}
            <Contents contents={contents} />
        </SidebarWrapper>
    );
};

const Contents: React.FC<ITableOfContentsProps> = ({ contents }) => {
    return (
        <ContentsList>
            {contents.map(content => {
                const { children, id, level, title } = content;

                return (
                    <li key={id}>
                        {/* containerId is set to an empty string to make body element the scroll container */}
                        <ContentLink
                            containerId=""
                            duration={docs.scrollDuration}
                            offset={-docs.headerOffset}
                            level={level}
                            to={id}
                        >
                            {title}
                        </ContentLink>
                        {children.length > 0 && <Contents contents={children} />}
                    </li>
                );
            })}
        </ContentsList>
    );
};

const ContentsList = styled.ul`
    ul {
        margin-bottom: 1rem;
    }
`;

const ContentLink = styled(Link)<{ level: number }>`
    display: inline-block;

    span {
        color: #999;
        font-weight: 300;
        transition: all 250ms ease-in-out;
    }

    &:hover span,
    &.active span {
        color: ${colors.brandDark};
    }

    &.active span {
        font-weight: 500;
    }

    ${({ level }) =>
        level === 1 &&
        `
        font-size: 0.8333rem;
        line-height: 1.5;
        margin-bottom: .5rem;

    `}

    ${({ level }) =>
        level === 2 &&
        `
        font-size: 0.7222rem;
        line-height: 2;
        padding-left: 0.7rem;
        border-left: 1px solid #e3e3e3;
        transition: all 250ms ease-in-out;

        &:hover,
        &.active {
            border-color: ${colors.brandDark};
        }
    `}
`;
