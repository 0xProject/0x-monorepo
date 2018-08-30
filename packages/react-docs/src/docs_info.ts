import { MenuSubsectionsBySection } from '@0xproject/react-shared';
import { DocAgnosticFormat, GeneratedDocJson, TypeDefinitionByName } from '@0xproject/types';
import compareVersions = require('compare-versions');
import * as _ from 'lodash';

import {
    ContractsByVersionByNetworkId,
    DocsInfoConfig,
    DocsMenu,
    DoxityDocObj,
    SectionNameToMarkdownByVersion,
    SectionsMap,
    SupportedDocJson,
} from './types';
import { doxityUtils } from './utils/doxity_utils';
import { TypeDocUtils } from './utils/typedoc_utils';

export class DocsInfo {
    public id: string;
    public type: SupportedDocJson;
    public displayName: string;
    public packageName: string;
    public packageUrl: string;
    public menu: DocsMenu;
    public sections: SectionsMap;
    public sectionNameToMarkdownByVersion: SectionNameToMarkdownByVersion;
    public contractsByVersionByNetworkId?: ContractsByVersionByNetworkId;
    constructor(config: DocsInfoConfig) {
        this.id = config.id;
        this.type = config.type;
        this.menu = config.markdownMenu;
        this.displayName = config.displayName;
        this.packageName = config.packageName;
        this.packageUrl = config.packageUrl;
        this.sections = config.markdownSections;
        this.sectionNameToMarkdownByVersion = config.sectionNameToMarkdownByVersion;
        this.contractsByVersionByNetworkId = config.contractsByVersionByNetworkId;
    }
    public getMenuSubsectionsBySection(docAgnosticFormat?: DocAgnosticFormat): MenuSubsectionsBySection {
        const menuSubsectionsBySection = {} as MenuSubsectionsBySection;
        if (_.isUndefined(docAgnosticFormat)) {
            return menuSubsectionsBySection;
        }

        const docSections = _.keys(this.sections);
        _.each(docSections, sectionName => {
            const docSection = docAgnosticFormat[sectionName];
            if (_.isUndefined(docSection)) {
                return; // no-op
            }

            const isExportedFunctionSection =
                docSection.functions.length === 1 &&
                _.isEmpty(docSection.types) &&
                _.isEmpty(docSection.methods) &&
                _.isEmpty(docSection.constructors) &&
                _.isEmpty(docSection.properties) &&
                _.isEmpty(docSection.events);

            if (!_.isUndefined(this.sections.types) && sectionName === this.sections.types) {
                const sortedTypesNames = _.sortBy(docSection.types, 'name');
                const typeNames = _.map(sortedTypesNames, t => t.name);
                menuSubsectionsBySection[sectionName] = typeNames;
            } else if (isExportedFunctionSection) {
                // Noop so that we don't have the method listed underneath itself.
            } else {
                let eventNames: string[] = [];
                if (!_.isUndefined(docSection.events)) {
                    const sortedEventNames = _.sortBy(docSection.events, 'name');
                    eventNames = _.map(sortedEventNames, m => m.name);
                }
                const propertiesSortedByName = _.sortBy(docSection.properties, 'name');
                const propertyNames = _.map(propertiesSortedByName, m => m.name);
                const methodsSortedByName = _.sortBy(docSection.methods, 'name');
                const methodNames = _.map(methodsSortedByName, m => m.name);
                const sortedFunctionNames = _.sortBy(docSection.functions, 'name');
                const functionNames = _.map(sortedFunctionNames, m => m.name);
                menuSubsectionsBySection[sectionName] = [
                    ...eventNames,
                    ...propertyNames,
                    ...functionNames,
                    ...methodNames,
                ];
            }
        });
        return menuSubsectionsBySection;
    }
    public getTypeDefinitionsByName(docAgnosticFormat: DocAgnosticFormat): { [name: string]: TypeDefinitionByName } {
        if (_.isUndefined(this.sections.types)) {
            return {};
        }

        const typeDocSection = docAgnosticFormat[this.sections.types];
        const typeDefinitionByName = _.keyBy(typeDocSection.types, 'name') as any;
        return typeDefinitionByName;
    }
    public convertToDocAgnosticFormat(docObj: DoxityDocObj | GeneratedDocJson): DocAgnosticFormat {
        if (this.type === SupportedDocJson.Doxity) {
            return doxityUtils.convertToDocAgnosticFormat(docObj as DoxityDocObj);
        } else {
            const typeDocUtils = new TypeDocUtils(docObj as GeneratedDocJson, this);
            return typeDocUtils.convertToDocAgnosticFormat();
        }
    }
}
