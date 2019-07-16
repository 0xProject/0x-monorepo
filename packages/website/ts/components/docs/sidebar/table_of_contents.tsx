import React from 'react';
import styled from 'styled-components';

import { Link } from '@0x/react-shared';

import { colors } from 'ts/style/colors';

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
        <ContentsAside>
            <ContentsWrapper>
                <Contents contents={contents} />
            </ContentsWrapper>
        </ContentsAside>
    );
};

const Contents: React.FC<ITableOfContentsProps> = ({ contents }) => {
    return (
        <ContentsList>
            {contents.map(content => {
                const { children, id, title } = content;
                return (
                    <li key={id}>
                        <ContentLink containerId="" to={id}>
                            {title}
                        </ContentLink>
                        {children.length > 0 && <Contents contents={children} />}
                    </li>
                );
            })}
        </ContentsList>
    );
};

const ContentsAside = styled.aside`
    position: relative;
`;

const ContentsWrapper = styled.div`
    position: sticky;
    top: 154px; /* To make space for the header (react-headroom) when clicking on links */
`;

const ContentsList = styled.ul`
    ul {
        border-left: 1px solid #e3e3e3;
        padding-left: 0.7rem;

        span {
            font-size: 0.7222rem;
            line-height: 1.45;
        }
    }
`;

const ContentLink = styled(Link)`
    display: block;
    font-size: 0.8333rem;
    margin-bottom: 1rem;

    span {
        color: ${({ theme }) => theme.paragraphColor};
        transition: color 250ms ease-in-out;
    }

    &.active span {
        color: ${colors.brandDark};
    }
`;
