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

export interface FiltersProps {
    groups: FilterGroup[];
}

export interface FiltersState {}

export interface FilterGroup {
    heading: string;
    name: string;
    filters: FilterProps[];
}

interface FilterProps {
    value: string;
    label: string;
}

export class Filters extends React.Component<FiltersProps, FiltersState> {
    public static defaultProps = {};
    public state: FiltersState = {};
    public render(): React.ReactNode {
        const { groups } = this.props;
        return (
            <Wrapper>
                {groups.map(({ heading, name, filters }: FilterGroup, index) => (
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
