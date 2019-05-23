import { CopperActivityType } from '../../../src/entities';
const ParsedActivityTypes: CopperActivityType[] = [
    { id: 0, name: 'Note', category: 'user', isDisabled: false, countAsInteraction: false },
    { id: 660496, name: 'To Do', category: 'user', isDisabled: false, countAsInteraction: false },
    { id: 660495, name: 'Meeting', category: 'user', isDisabled: false, countAsInteraction: true },
    { id: 660494, name: 'Phone Call', category: 'user', isDisabled: false, countAsInteraction: true },
    { id: 1, name: 'Property Changed', category: 'system', isDisabled: false, countAsInteraction: false },
    {
        id: 3,
        name: 'Pipeline Stage Changed',
        category: 'system',
        isDisabled: false,
        countAsInteraction: false,
    },
];
export { ParsedActivityTypes };
