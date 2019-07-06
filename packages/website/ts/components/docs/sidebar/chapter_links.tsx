import React from 'react';

import { colors } from 'ts/style/colors';
import { styled } from 'ts/style/theme';

interface IGroupProps {
    heading: string;
    name: string;
    filters: IFilterProps[];
}

interface IFilterProps {
    value: string;
    label: string;
}

const groups: IGroupProps[] = [
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

export const ChapterLinks: React.FC = () => {
    return (
        <ChapterLinksWrapper>
            {groups.map(({ heading, name, filters }: IGroupProps, groupIndex) => (
                <ChapterGroupWrapper key={`filter-group-${groupIndex}`}>
                    <ChapterLink href="#index" hasChildren={filters.length > 0}>
                        {heading}
                    </ChapterLink>
                    <ChapterChildren>
                        {filters.map(({ value, label }: IFilterProps, filterIndex) => (
                            <ChapterSublink
                                href={`#filter-${name}-${filterIndex}`}
                                key={`filter-${name}-${filterIndex}`}
                                data-level="2"
                            >
                                {label}
                            </ChapterSublink>
                        ))}
                    </ChapterChildren>
                </ChapterGroupWrapper>
            ))}
        </ChapterLinksWrapper>
    );
};

const ChapterLinksWrapper = styled.ul`
    position: relative;
`;

const ChapterGroupWrapper = styled.li`
    margin-bottom: 1.111em;
`;

const ChapterLink = styled.a<{ hasChildren?: boolean }>`
    margin-bottom: ${props => props.hasChildren && '1rem'};
    color: ${colors.textDarkSecondary};
    display: block;
    font-size: 0.8333rem;
`;

const ChapterSublink = styled(ChapterLink)`
    font-size: 0.7222rem;
    line-height: 1.45;

    &:not(:first-child) {
        margin-top: 0.555555556rem;
    }
`;

// const ChapterGroupWrapper = styled(Heading)`
//     color: ${colors.textDarkPrimary};
//     font-size: 1rem !important;
//     font-weight: 400 !important;
//     margin-bottom: 1em !important;
// `;

const ChapterChildren = styled.div`
    border-left: 1px solid #e3e3e3;
    padding-left: 0.7rem;
`;
