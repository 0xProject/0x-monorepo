import { Type as TypeDef, TypeDefinitionByName, TypeDocTypes } from '@0x/types';
import { errorUtils } from '@0x/utils';
import * as _ from 'lodash';
import * as React from 'react';
import * as ReactTooltip from 'react-tooltip';
import { colors } from 'ts/utils/colors';
import { DocsInfo } from 'ts/utils/docs_info';
import { utils } from 'ts/utils/utils';

import { Link } from '../shared/link';

import { Signature } from './signature';
import { TypeDefinition } from './type_definition';

const basicJsTypes = ['string', 'number', 'undefined', 'null', 'boolean'];
const basicSolidityTypes = ['bytes', 'bytes4', 'bytes32', 'uint8', 'uint256', 'address'];

const defaultProps = {};

export interface TypeProps {
    type: TypeDef;
    docsInfo: DocsInfo;
    sectionName: string;
    typeDefinitionByName?: TypeDefinitionByName;
    isInPopover: boolean;
}

// The return type needs to be `any` here so that we can recursively define <Type /> components within
// <Type /> components (e.g when rendering the union type).
export const Type: React.SFC<TypeProps> = (props: TypeProps): any => {
    const type = props.type;
    const isReference = type.typeDocType === TypeDocTypes.Reference;
    const isArray = type.typeDocType === TypeDocTypes.Array;
    let typeNameColor = 'inherit';
    let typeName: string | React.ReactNode;
    let typeArgs: React.ReactNode[] = [];
    switch (type.typeDocType) {
        case TypeDocTypes.Intrinsic:
        case TypeDocTypes.Unknown:
            typeName = type.name;
            typeNameColor = colors.orange;
            break;

        case TypeDocTypes.Reference:
            typeName = type.name;
            typeArgs = _.map(type.typeArguments, (arg: TypeDef) => {
                if (arg.typeDocType === TypeDocTypes.Array) {
                    const key = `type-${arg.elementType.name}-${arg.elementType.typeDocType}`;
                    return (
                        <span>
                            <Type
                                key={key}
                                type={arg}
                                sectionName={props.sectionName}
                                typeDefinitionByName={props.typeDefinitionByName}
                                docsInfo={props.docsInfo}
                                isInPopover={props.isInPopover}
                            />
                            []
                        </span>
                    );
                } else {
                    const subType = (
                        <Type
                            key={`type-${arg.name}-${arg.value}-${arg.typeDocType}`}
                            type={arg}
                            sectionName={props.sectionName}
                            typeDefinitionByName={props.typeDefinitionByName}
                            docsInfo={props.docsInfo}
                            isInPopover={props.isInPopover}
                        />
                    );
                    return subType;
                }
            });
            break;

        case TypeDocTypes.StringLiteral:
            typeName = `'${type.value}'`;
            typeNameColor = colors.green;
            break;

        case TypeDocTypes.Array:
            typeName = type.elementType.name;
            if (_.includes(basicJsTypes, typeName) || _.includes(basicSolidityTypes, typeName)) {
                typeNameColor = colors.orange;
            }
            break;

        case TypeDocTypes.Union:
            const unionTypes = _.map(type.types, t => {
                return (
                    <Type
                        key={`type-${t.name}-${t.value}-${t.typeDocType}`}
                        type={t}
                        sectionName={props.sectionName}
                        typeDefinitionByName={props.typeDefinitionByName}
                        docsInfo={props.docsInfo}
                        isInPopover={props.isInPopover}
                    />
                );
            });
            typeName = _.reduce(unionTypes, (prev: React.ReactNode, curr: React.ReactNode) => {
                return [prev, '|', curr];
            });
            break;

        case TypeDocTypes.Reflection:
            if (type.method !== undefined) {
                typeName = (
                    <Signature
                        name={type.method.name}
                        returnType={type.method.returnType}
                        parameters={type.method.parameters}
                        typeParameter={type.method.typeParameter}
                        sectionName={props.sectionName}
                        shouldHideMethodName={true}
                        shouldUseArrowSyntax={true}
                        docsInfo={props.docsInfo}
                        typeDefinitionByName={props.typeDefinitionByName}
                        isInPopover={props.isInPopover}
                    />
                );
            } else if (type.indexSignature !== undefined) {
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
                typeName = (
                    <span key={`indexSignature-${type.name}-${is.keyType.name}`}>
                        {'{'}[{param}]: {is.valueName}
                        {'}'}
                    </span>
                );
            } else {
                throw new Error(`Unrecognized Reflection type that isn't a Method nor an Index Signature`);
            }

            break;

        case TypeDocTypes.TypeParameter:
            typeName = type.name;
            break;

        case TypeDocTypes.Intersection:
            const intersectionsTypes = _.map(type.types, t => {
                return (
                    <Type
                        key={`type-${t.name}-${t.value}-${t.typeDocType}`}
                        type={t}
                        sectionName={props.sectionName}
                        typeDefinitionByName={props.typeDefinitionByName}
                        docsInfo={props.docsInfo}
                        isInPopover={props.isInPopover}
                    />
                );
            });
            typeName = _.reduce(intersectionsTypes, (prev: React.ReactNode, curr: React.ReactNode) => {
                return [prev, '&', curr];
            });
            break;

        case TypeDocTypes.Tuple:
            const tupleTypes = _.map(type.tupleElements, (t, i) => {
                return (
                    <Type
                        key={`type-tuple-${t.name}-${t.typeDocType}-${i}`}
                        type={t}
                        sectionName={props.sectionName}
                        typeDefinitionByName={props.typeDefinitionByName}
                        docsInfo={props.docsInfo}
                        isInPopover={props.isInPopover}
                    />
                );
            });
            typeName = (
                <div>
                    [
                    {_.reduce(tupleTypes, (prev: React.ReactNode, curr: React.ReactNode) => {
                        return [prev, ', ', curr];
                    })}
                    ]
                </div>
            );
            break;

        default:
            throw errorUtils.spawnSwitchErr('type.typeDocType', type.typeDocType);
    }
    // HACK: Normalize BigNumber to simply BigNumber. For some reason the type
    // name is unpredictably one or the other.
    if (typeName === 'BigNumber') {
        typeName = 'BigNumber';
    }
    const commaSeparatedTypeArgs = _.reduce(typeArgs, (prev: React.ReactNode, curr: React.ReactNode) => {
        return [prev, ', ', curr];
    });

    const isExportedClassReference = !!props.type.isExportedClassReference;
    const typeNameUrlIfExists = props.type.externalLink !== undefined ? props.type.externalLink : undefined;
    if (typeNameUrlIfExists !== undefined) {
        typeName = props.isInPopover ? (
            <span style={{ color: colors.lightBlueA700, cursor: 'pointer' }}>{typeName}</span>
        ) : (
            <Link to={typeNameUrlIfExists} shouldOpenInNewTab={true} fontColor={colors.lightBlueA700}>
                {typeName}
            </Link>
        );
    } else if (
        (isReference || isArray) &&
        ((props.typeDefinitionByName && props.typeDefinitionByName[typeName as string]) || isExportedClassReference)
    ) {
        const id = Math.random().toString();
        const typeDefinitionAnchorId = isExportedClassReference
            ? props.type.name
            : `${props.docsInfo.typeSectionName}-${typeName}`;
        typeName = (
            <span>
                {utils.isUserOnMobile() || props.isInPopover || isExportedClassReference ? (
                    <span style={{ color: colors.lightBlueA700, cursor: 'pointer' }}>{typeName}</span>
                ) : (
                    <Link to={typeDefinitionAnchorId}>
                        <span
                            data-tip={true}
                            data-for={id}
                            style={{
                                color: colors.lightBlueA700,
                                cursor: 'pointer',
                                display: 'inline-block',
                            }}
                        >
                            {typeName}
                            <ReactTooltip type="light" effect="solid" id={id} className="typeTooltip">
                                <TypeDefinition
                                    sectionName={props.sectionName}
                                    customType={props.typeDefinitionByName[typeName as string]}
                                    shouldAddId={false}
                                    docsInfo={props.docsInfo}
                                    typeDefinitionByName={props.typeDefinitionByName}
                                    isInPopover={true}
                                />
                            </ReactTooltip>
                        </span>
                    </Link>
                )}
            </span>
        );
    }
    return (
        <span>
            <span style={{ color: typeNameColor }}>{typeName}</span>
            {isArray && '[]'}
            {!_.isEmpty(typeArgs) && (
                <span>
                    {'<'}
                    {commaSeparatedTypeArgs}
                    {'>'}
                </span>
            )}
        </span>
    );
};

Type.defaultProps = defaultProps;
