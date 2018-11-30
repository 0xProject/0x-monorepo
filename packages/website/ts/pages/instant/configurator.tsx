import * as React from 'react';

import { Container } from 'ts/components/ui/container';
import { Text } from 'ts/components/ui/text';
import { ActionLink } from 'ts/pages/instant/action_link';
import { CodeDemo } from 'ts/pages/instant/code_demo';
import { ConfigGenerator } from 'ts/pages/instant/config_generator';
import { colors } from 'ts/style/colors';

import { ZeroExInstantBaseConfig } from '../../../../instant/src/types';

export interface ConfiguratorProps {
    hash: string;
}

export interface ConfiguratorState {
    instantConfig: ZeroExInstantBaseConfig;
}

export class Configurator extends React.Component<ConfiguratorProps> {
    public state: ConfiguratorState = {
        instantConfig: {
            orderSource: 'https://api.radarrelay.com/0x/v2/',
            availableAssetDatas: [],
        },
    };
    public render(): React.ReactNode {
        const { hash } = this.props;
        return (
            <Container
                className="flex justify-center py4 px3"
                id={hash}
                backgroundColor={colors.instantTertiaryBackground}
            >
                <Container className="mx3">
                    <Container className="mb3">
                        <Text fontSize="20px" lineHeight="28px" fontColor={colors.white} fontWeight={500}>
                            0x Instant Configurator
                        </Text>
                    </Container>
                    <ConfigGenerator value={this.state.instantConfig} onConfigChange={this._handleConfigChange} />
                </Container>
                <Container className="mx3">
                    <Container className="mb3 flex justify-between">
                        <Text fontSize="20px" lineHeight="28px" fontColor={colors.white} fontWeight={500}>
                            Code Snippet
                        </Text>
                        <ActionLink displayText="Explore the Docs" linkSrc="/docs/instant" color={colors.grey} />
                    </Container>
                    <CodeDemo />
                </Container>
            </Container>
        );
    }
    private readonly _handleConfigChange = (config: ZeroExInstantBaseConfig) => {
        this.setState({
            instantConfig: config,
        });
    };
}
