import { DocAgnosticFormat, DocSection } from '@0xproject/react-docs';

export class SolidityDocFormat implements DocAgnosticFormat {
    [sectionName: string]: DocSection;
}
