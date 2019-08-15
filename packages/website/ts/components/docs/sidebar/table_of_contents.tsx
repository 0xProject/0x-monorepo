import React from 'react';
import styled from 'styled-components';

import { Link } from '@0x/react-shared';

import { colors } from 'ts/style/colors';

import { SidebarWrapper } from 'ts/components/docs/sidebar/sidebar_wrapper';

interface ITableOfContentsProps {
    contents: IContents[];
}

export interface IContents {
    children: IContents[];
    id: string;
    level: number;
    title: string;
}

export const TableOfContents: React.FC<ITableOfContentsProps> = ({ contents }) => {
    return (
        <SidebarWrapper>
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
                        <ContentLink containerId="" level={level} to={id}>
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
    color: ${({ theme }) => theme.paragraphColor};
    transition: all 250ms ease-in-out;

    &.active span {
        color: ${colors.brandDark};
    }

    ${({ level }) =>
        level === 2 &&
        `
        font-size: 0.8333rem;
        margin-bottom: 1rem;

    `}

    ${({ level }) =>
        level === 3 &&
        `
        font-size: 0.7222rem;
        line-height: 1.45;
        padding: 0.25rem 0 0.25rem 0.7rem;
        border-left: 1px solid #e3e3e3;

        &.active {
            border-color: ${colors.brandDark};
        }
    `}
`;
