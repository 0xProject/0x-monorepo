import React from 'react';
import styled from 'styled-components';

import { Link } from 'ts/components/documentation/shared/link';

import { colors } from 'ts/style/colors';
import { docs } from 'ts/style/docs';

import { SidebarWrapper } from 'ts/components/docs/sidebar/sidebar_wrapper';

import { Select } from 'ts/components/docs/sidebar/select';

interface ITableOfContentsProps {
    contents: IContents[];
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

const items: ISelectItemConfig[] = [
    {
        label: 'v6.1.10',
        onClick: () => {
            console.log('YEAH 10');
        },
    },
    {
        label: 'v6.1.11',
        onClick: () => {
            console.log('YEAH 11');
        },
    },
];

const onChange = () => {
    console.log('ON CHANGE!');
};

export const TableOfContents: React.FC<ITableOfContentsProps> = ({ contents }) => {
    return (
        <SidebarWrapper>
            <Select emptyText="6.1.11" id="select-versions" items={items} value="6.1.11" onChange={onChange} />
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
