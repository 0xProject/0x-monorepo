import { Link } from '@0x/react-shared';
import * as _ from 'lodash';
import * as React from 'react';
import styled, { withTheme } from 'styled-components';
import { Heading, Paragraph } from 'ts/components/text';
import { colors } from 'ts/style/colors';

import { Tag } from 'ts/components/docs/resource/tag';

export interface ResourceProps {
    heading?: string;
    description?: string;
    url?: string;
    tags: TagProps[];
}

interface WrapperProps {
}

interface TagProps {
    label: React.ReactNode;
}

export const Resource: React.FunctionComponent<ResourceProps> = ({ heading, description, url, tags }: ResourceProps) => (
    <Wrapper href={url}>
        <Heading color={colors.brandDark} size="small" marginBottom="8px">{heading}</Heading>
        <Paragraph size="default" marginBottom="30px">{description}</Paragraph>
        <Meta>
            <Tags>
                {tags.map((tag, index) => <Tag key={`tag-${index}`}>{tag.label}</Tag>)}
            </Tags>
            <div>
                Rating
            </div>
        </Meta>
    </Wrapper>
);

Resource.defaultProps = {
    heading: 'Need some help?',
    description: 'Get in touch here and we’ll be happy to help.',
};

const Wrapper = styled.a<WrapperProps>`
    border: 1px solid #D7E3DB;
    padding: 25px 30px;
    margin-bottom: 1.875rem;
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
