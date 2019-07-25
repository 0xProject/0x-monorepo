import * as _ from 'lodash';
import * as React from 'react';

import { CustomType, TypeDefinitionByName } from '@0x/types';

import { DocsInfo } from 'ts/utils/docs_info';

import { Signature } from './signature';
import { Type } from './type';

const defaultProps = {};

export interface InterfaceProps {
    type: CustomType;
    sectionName: string;
    docsInfo: DocsInfo;
    typeDefinitionByName: TypeDefinitionByName;
    isInPopover: boolean;
}

export const Interface: React.SFC<InterfaceProps> = (props: InterfaceProps): any => {
    const type = props.type;
    const properties = _.map(type.children, (property, i) => {
        return (
            <span key={`property-${property.name}-${property.type}-${type.name}-${i}`}>
                {property.name}:{' '}
                {property.type && property.type.method !== undefined ? (
                    <Signature
                        name={property.type.method.name}
                        returnType={property.type.method.returnType}
                        parameters={property.type.method.parameters}
                        typeParameter={property.type.method.typeParameter}
                        sectionName={props.sectionName}
                        shouldHideMethodName={true}
                        shouldUseArrowSyntax={true}
                        docsInfo={props.docsInfo}
                        typeDefinitionByName={props.typeDefinitionByName}
                        isInPopover={props.isInPopover}
                    />
                ) : (
                    <Type
                        type={property.type}
                        sectionName={props.sectionName}
                        docsInfo={props.docsInfo}
                        typeDefinitionByName={props.typeDefinitionByName}
                        isInPopover={props.isInPopover}
                    />
                )}
                ,
            </span>
        );
    });
    const hasIndexSignature = type.indexSignature !== undefined;
    if (hasIndexSignature) {
        const is = type.indexSignature;
        const param = (
            <span key={`indexSigParams-${is.keyName}-${is.keyType}-${type.name}`}>
                {is.keyName}:{' '}
                <Type
                    type={is.keyType}
                    sectionName={props.sectionName}
                    docsInfo={props.docsInfo}
                    typeDefinitionByName={props.typeDefinitionByName}
                    isInPopover={props.isInPopover}
                />
            </span>
        );
        properties.push(
            <span key={`indexSignature-${type.name}-${is.keyType.name}`}>
                [{param}]: {is.valueName},
            </span>,
        );
    }
    const propertyList = _.reduce(properties, (prev: React.ReactNode, curr: React.ReactNode) => {
        return [prev, '\n\t', curr];
    });
    return (
        <span>
            {`{`}
            <br />
            {'\t'}
            {propertyList}
            <br />
            {`}`}
        </span>
    );
};

Interface.defaultProps = defaultProps;
