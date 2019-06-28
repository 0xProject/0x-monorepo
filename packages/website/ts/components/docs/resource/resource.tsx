import { Link } from '@0x/react-shared';
import * as _ from 'lodash';
import * as React from 'react';
import styled, { withTheme } from 'styled-components';
import { Heading, Paragraph } from 'ts/components/text';
import { colors } from 'ts/style/colors';

import { Difficulty, Level } from 'ts/components/docs/resource/level';
import { Tag } from 'ts/components/docs/resource/tag';

export interface ResourceProps {
    heading?: string;
    description?: string;
    url?: string;
    tags: TagProps[];
}

interface TagProps {
    label: React.ReactNode;
    isInverted?: boolean;
}

export const Resource: React.FunctionComponent<ResourceProps> = ({
    heading,
    description,
    url,
    tags,
}: ResourceProps) => (
    <Wrapper>
        <Heading color={colors.brandDark} size="small" marginBottom="8px">
            <Link to={url}>{heading}</Link>
        </Heading>
        <Paragraph size="default" marginBottom="30px">
            {description}
        </Paragraph>
        <Meta>
            <Tags>
                {tags.map(({ label, isInverted }, index) => (
                    <Tag key={`tag-${index}`} isInverted={isInverted}>
                        {label}
                    </Tag>
                ))}
            </Tags>
            <Level difficulty={Difficulty.Beginner} />
        </Meta>
    </Wrapper>
);

Resource.defaultProps = {
    heading: 'Need some help?',
    description: 'Get in touch here and we’ll be happy to help.',
};

const Wrapper = styled.div`
    border: 1px solid #d7e3db;
    padding: 25px 30px;
    margin-bottom: 1.111111111rem;
    display: block;
`;

const Meta = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
`;

const Tags = styled.div`
    display: flex;
    align-items: center;
`;
