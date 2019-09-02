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
            <div>
                {contents.map(content => {
                    const { id, level, title } = content;
                    /* containerId is set to an empty string to make body element the scroll container */
                    return (
                        <ContentLink
                            activeClass="toc-link-active"
                            containerId=""
                            duration={docs.scrollDuration}
                            offset={-docs.headerOffset}
                            level={level}
                            to={id}
                            key={id}
                        >
                            {title}
                        </ContentLink>
                    );
                })}
            </div>
        </SidebarWrapper>
    );
};

const ContentLink = styled(Link)<{ level: number }>`
    display: block;

    span {
        color: #939393;
        font-weight: 300;
        transition: all 150ms ease-in-out;
    }

    &:hover span,
    &.toc-link-active span {
        color: ${colors.brandDark};
    }

    &.toc-link-active span {
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
        &.toc-link-active {
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
