import * as _ from 'lodash';
import { Table, TableBody, TableHeader, TableHeaderColumn, TableRow, TableRowColumn } from 'material-ui/Table';
import * as React from 'react';

const POSITIONS = [
    {
        name: 'Community Director',
        department: 'Marketing',
        office: 'Remote / San Francisco',
    },
    {
        name: 'Data Scientist / Data Engineer',
        department: 'Engineering',
        office: 'Remote / San Francisco',
    },
    {
        name: 'Executive Assitant / Office Manager',
        department: 'Operations',
        office: 'Remote / San Francisco',
    },
    {
        name: 'Research Fellow - Economics / Governance',
        department: 'Engineering',
        office: 'Remote / San Francisco',
    },
    {
        name: 'Software Engineer - Blockchain',
        department: 'Engineer',
        office: 'Remote / San Francisco',
    },
    {
        name: 'Software Engineer - Full-stack',
        department: 'Marketing',
        office: 'Remote / San Francisco',
    },
];

export interface OpenPositionsProps {
    hash: string;
}

export const OpenPositions = (props: OpenPositionsProps) => {
    const labelStyle = { fontFamily: 'Roboto Mono', fontSize: 18 };
    return (
        <div id={props.hash} className="py4" style={{ paddingLeft: 200, paddingRight: 200 }}>
            <Table selectable={false}>
                <TableHeader displaySelectAll={false} adjustForCheckbox={false}>
                    <TableRow>
                        <TableHeaderColumn colSpan={6} style={labelStyle}>
                            Position
                        </TableHeaderColumn>
                        <TableHeaderColumn colSpan={3} style={labelStyle}>
                            Department
                        </TableHeaderColumn>
                        <TableHeaderColumn colSpan={3} style={labelStyle}>
                            Office
                        </TableHeaderColumn>
                    </TableRow>
                </TableHeader>
                <TableBody displayRowCheckbox={false} showRowHover={true}>
                    {_.map(POSITIONS, position => {
                        return (
                            <TableRow hoverable={true} displayBorder={false} style={{ height: 100, border: 2 }}>
                                <TableRowColumn colSpan={6} style={labelStyle}>
                                    {position.name}
                                </TableRowColumn>
                                <TableRowColumn colSpan={3} style={labelStyle}>
                                    {position.department}
                                </TableRowColumn>
                                <TableRowColumn colSpan={3} style={labelStyle}>
                                    {position.office}
                                </TableRowColumn>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
};
