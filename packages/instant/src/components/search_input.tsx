import * as _ from 'lodash';
import * as React from 'react';

import { ColorOption } from '../style/theme';

import { Container } from './ui/container';
import { Flex } from './ui/flex';
import { Icon } from './ui/icon';
import { Input, InputProps } from './ui/input';

export interface SearchInputProps extends InputProps {
    backgroundColor?: ColorOption;
}

export const SearchInput: React.StatelessComponent<SearchInputProps> = props => (
    <Container backgroundColor={props.backgroundColor} borderRadius="3px" padding=".5em .3em">
        <Flex justify="flex-start" align="flex-end">
            <Icon width={14} height={14} icon="search" color={ColorOption.lightGrey} padding="0px 12px" />
            <Input {...props} fontSize="14px" fontColor={props.fontColor} />
        </Flex>
    </Container>
);

SearchInput.displayName = 'SearchInput';

SearchInput.defaultProps = {
    backgroundColor: ColorOption.lightestGrey,
    fontColor: ColorOption.grey,
};
