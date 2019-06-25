import * as React from 'react';
import * as CopyToClipboard from 'react-copy-to-clipboard';
import SyntaxHighlighter from 'react-syntax-highlighter';

import { Button } from 'ts/components/button';
import { Heading } from 'ts/components/text';
import { Container } from 'ts/components/ui/container';
import { Filter } from 'ts/components/docs/sidebar/filter';
import { colors } from 'ts/style/colors';
import { styled } from 'ts/style/theme';
import { zIndex } from 'ts/style/z_index';

export interface FiltersProps {
}

export interface FiltersState {
}

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
                label: 'Mesh'
            },
            {
                value: 'testing',
                label: 'Testing'
            },
            {
                value: 'mesh',
                label: 'Mesh'
            },
            {
                value: 'testing',
                label: 'Testing'
            },
        ]
    },
    {
        heading: 'Level',
        name: 'level',
        filters: [
            {
                value: 'beginner',
                label: 'Beginner'
            },
            {
                value: 'intermediate',
                label: 'Intermediate'
            },
            {
                value: 'advanced',
                label: 'Advanced'
            },
        ]
    },
]

export class Filters extends React.Component<FiltersProps, FiltersState> {
    public static defaultProps = {
    };
    public state: FiltersState = {
    };
    public render(): React.ReactNode {
        return (
            <Wrapper>
                {groups.map(({ heading, name, filters }: Group, index) => (
                    <GroupWrapper key={`filter-group-${index}`}>
                        <GroupHeading asElement="h3">{heading}</GroupHeading>
                        {filters.map(({ value, label }: FilterProps, index) => (
                        <Filter key={`filter-${name}-${index}`} name={name} value={value} label={label} />
                ))}
                    </GroupWrapper>
                ))}
            </Wrapper>
        );
    }
    /*private readonly _handleCopyClick = () => {
        this.setState({ didCopyFilters: true });
    };*/
}

const Wrapper = styled.div`
    position: relative;
    max-width: 702px;
`;

const GroupWrapper = styled.div`
    margin-bottom: 2.22em;
`;

const GroupHeading = styled(Heading)`
color: ${colors.textDarkPrimary};
    font-size: 1rem !important;
    font-weight: 400 !important;
    margin-bottom: 1em !important;
`;
