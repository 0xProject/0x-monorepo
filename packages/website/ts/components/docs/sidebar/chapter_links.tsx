import * as React from 'react';
import * as CopyToClipboard from 'react-copy-to-clipboard';
import SyntaxHighlighter from 'react-syntax-highlighter';

import { Button } from 'ts/components/button';
import { Filter } from 'ts/components/docs/sidebar/filter';
import { Heading } from 'ts/components/text';
import { Container } from 'ts/components/ui/container';
import { colors } from 'ts/style/colors';
import { styled } from 'ts/style/theme';
import { zIndex } from 'ts/style/z_index';

export interface ChapterLinkProps {}

export interface ChapterLinkState {}

interface Group {
    heading: string;
    name: string;
    filters: FilterProps[];
}

interface FilterProps {
    value: string;
    label: string;
}

const groups: Group[] = [
    {
        heading: 'Topic',
        name: 'topic',
        filters: [
            {
                value: 'mesh',
                label: 'Mesh',
            },
            {
                value: 'testing',
                label: 'Testing',
            },
            {
                value: 'mesh',
                label: 'Mesh',
            },
            {
                value: 'testing',
                label: 'Testing',
            },
        ],
    },
    {
        heading: 'Level',
        name: 'level',
        filters: [
            {
                value: 'beginner',
                label: 'Beginner',
            },
            {
                value: 'intermediate',
                label: 'Intermediate',
            },
            {
                value: 'advanced',
                label: 'Advanced',
            },
        ],
    },
];

export class ChapterLinks extends React.Component<ChapterLinkProps, ChapterLinkState> {
    public static defaultProps = {};
    public state: ChapterLinkState = {};
    public render(): React.ReactNode {
        return (
            <Wrapper>
                {groups.map(({ heading, name, filters }: Group, index) => (
                    <GroupWrapper key={`filter-group-${index}`}>
                        <Link href="#index" hasChildren={filters.length > 0}>
                            {heading}
                        </Link>
                        <Children>
                            {filters.map(({ value, label }: FilterProps, index) => (
                                <Sublink
                                    href={`#filter-${name}-${index}`}
                                    key={`filter-${name}-${index}`}
                                    data-level="2"
                                >
                                    {label}
                                </Sublink>
                            ))}
                        </Children>
                    </GroupWrapper>
                ))}
            </Wrapper>
        );
    }
}

const Wrapper = styled.ul`
    position: relative;
`;

const GroupWrapper = styled.li`
    margin-bottom: 1.111em;
`;

const Link = styled.a<{ hasChildren?: boolean }>`
    margin-bottom: ${props => props.hasChildren && '1rem'};
    color: ${colors.textDarkSecondary};
    display: block;
    font-size: 0.8333rem;
`;

const Sublink = styled(Link)`
    font-size: 0.7222rem;
    line-height: 1.45;

    &:not(:first-child) {
        margin-top: 0.555555556rem;
    }
`;

const GroupHeading = styled(Heading)`
    color: ${colors.textDarkPrimary};
    font-size: 1rem !important;
    font-weight: 400 !important;
    margin-bottom: 1em !important;
`;

const Children = styled.div`
    border-left: 1px solid #e3e3e3;
    padding-left: 0.7rem;
`;
