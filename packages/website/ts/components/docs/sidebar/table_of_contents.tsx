import React from 'react';

// import { Link } from '@0x/react-shared';

import { colors } from 'ts/style/colors';
import { styled } from 'ts/style/theme';

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
    console.log('contents', contents);
    return (
        <ul>
            {contents.map(content => {
                const { children, id, title } = content;
                return (
                    <li key={id}>
                        <ContentLink href={`#${id}`}>{title}</ContentLink>
                        {children.length > 0 && <TableOfContents contents={children} />}
                    </li>
                );
            })}
        </ul>
    );
};

const ContentLink = styled.a`
    display: block;
    font-size: 0.8333rem;
    color: ${colors.textDarkSecondary};
    margin-bottom: 1rem;

    & + ul {
        border-left: 1px solid #e3e3e3;
        padding-left: 0.7rem;

        p {
            font-size: 0.7222rem;
            line-height: 1.45;
        }
    }
`;
