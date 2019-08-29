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
        <ul>
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
        </ul>
    );
};

const ContentLink = styled(Link)<{ level: number }>`
    display: inline-block;

    span {
        color: #939393;
        font-weight: 300;
        transition: all 150ms ease-in-out;
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
        font-size: 0.83rem;
        line-height: 1.5;
        margin: .4rem 0;
    `}

    ${({ level }) =>
        level !== 1 &&
        `
        line-height: 2;
        border-left: 1px solid #efefef;
        transition: all 150ms ease-in-out;

        &:hover,
        &.active {
            border-color: ${colors.brandDark};
        }
    `}

    ${({ level }) =>
        level === 2 &&
        `
        font-size: 0.72rem;
        padding-left: 0.7rem;

    `}

    ${({ level }) =>
        level === 3 &&
        `
        font-size: 0.61rem;
        padding-left: 1.4rem;
    `}
`;
