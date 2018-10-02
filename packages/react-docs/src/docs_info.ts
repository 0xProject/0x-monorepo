import { MenuSubsectionsBySection } from '@0xproject/react-shared';
import { DocAgnosticFormat, TypeDefinitionByName } from '@0xproject/types';
import * as _ from 'lodash';

import {
    ContractsByVersionByNetworkId,
    DocsInfoConfig,
    DocsMenu,
    SectionNameToMarkdownByVersion,
    SectionsMap,
    SupportedDocJson,
} from './types';

export class DocsInfo {
    public id: string;
    public type: SupportedDocJson;
    public displayName: string;
    public packageName: string;
    public packageUrl: string;
    public menu: DocsMenu;
    public typeSectionName: string;
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
        this.typeSectionName = config.type === SupportedDocJson.SolDoc ? 'structs' : 'types';
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

            if (sectionName === this.typeSectionName) {
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
        if (_.isUndefined(docAgnosticFormat[this.typeSectionName])) {
            return {};
        }

        const section = docAgnosticFormat[this.typeSectionName];
        const typeDefinitionByName = _.keyBy(section.types, 'name') as any;
        return typeDefinitionByName;
    }
}
