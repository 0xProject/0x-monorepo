import { colors } from '@0x/react-shared';
import * as _ from 'lodash';
import * as React from 'react';
import { Button } from 'ts/components/ui/button';
import { Container } from 'ts/components/ui/container';
import { DropDown, DropdownMouseEvent } from 'ts/components/ui/drop_down';
import { Text } from 'ts/components/ui/text';
import { styled } from 'ts/style/theme';

interface ActiveNodeProps {
    className?: string;
    selectedVersion: string;
}

const PlainActiveNode: React.StatelessComponent<ActiveNodeProps> = ({ className, selectedVersion }) => (
    <Container className={className}>
        <Container className="flex justify-center">
            <Text fontColor={colors.grey700} fontSize="12px">
                v {selectedVersion}
            </Text>
            <Container paddingLeft="6px">
                <i className="zmdi zmdi-chevron-down" style={{ fontSize: 17, color: 'rgba(153, 153, 153, 0.8)' }} />
            </Container>
        </Container>
    </Container>
);

const ActiveNode = styled(PlainActiveNode)`
    cursor: pointer;
    border: 2px solid ${colors.beigeWhite};
    border-radius: 4px;
    padding: 4px 6px 4px 8px;
`;

interface VersionDropDownProps {
    selectedVersion: string;
    versions: string[];
    onVersionSelected: (semver: string) => void;
}

interface VersionDropDownState {}

export class VersionDropDown extends React.Component<VersionDropDownProps, VersionDropDownState> {
    public render(): React.ReactNode {
        const activeNode = <ActiveNode selectedVersion={this.props.selectedVersion} />;
        return (
            <DropDown
                activateEvent={DropdownMouseEvent.Click}
                activeNode={activeNode}
                popoverContent={this._renderDropdownMenu()}
                anchorOrigin={{ horizontal: 'middle', vertical: 'bottom' }}
                targetOrigin={{ horizontal: 'middle', vertical: 'top' }}
                popoverStyle={{ borderRadius: 4 }}
            />
        );
    }
    private _renderDropdownMenu(): React.ReactNode {
        const items = _.map(this.props.versions, version => {
            const isSelected = version === this.props.selectedVersion;
            return (
                <Container key={`dropdown-items-${version}`}>
                    <Button
                        borderRadius="0px"
                        padding="0.8em 0em"
                        width="100%"
                        isDisabled={isSelected}
                        onClick={this._onClick.bind(this, version)}
                    >
                        v {version}
                    </Button>
                </Container>
            );
        });
        const dropdownMenu = <Container width="88px">{items}</Container>;
        return dropdownMenu;
    }
    private _onClick(selectedVersion: string): void {
        this.props.onVersionSelected(selectedVersion);
    }
}
