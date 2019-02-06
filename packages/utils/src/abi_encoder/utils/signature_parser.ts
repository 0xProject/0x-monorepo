import { DataItem } from 'ethereum-types';
import * as _ from 'lodash';

interface Node {
    value: string;
    children: Node[];
    parent?: Node;
}

function parseNode(node: Node): DataItem {
    const components: DataItem[] = [];
    _.each(node.children, (child: Node) => {
        const component = parseNode(child);
        components.push(component);
    });
    const dataItem: DataItem = {
        name: '',
        type: node.value,
    };
    if (!_.isEmpty(components)) {
        dataItem.components = components;
    }
    return dataItem;
}

/**
 * Returns an array of DataItem's corresponding to the input signature.
 * A signature can be in two forms: '<DataItem.type>' or '(<DataItem1.type>, <DataItem2.type>, ...)
 * An example of the first form would be 'address' or 'uint256[]' or 'bytes[5][]'
 * An example of the second form would be '(address, uint256)' or '(address, uint256)[]'
 * @param signature of input DataItem
 * @return DataItem derived from input signature
 */
export function generateDataItemsFromSignature(signature: string): DataItem {
    // No data item corresponds to an empty signature
    if (_.isEmpty(signature)) {
        throw new Error(`Cannot parse data item from empty signature, ''`);
    }
    // Create a parse tree for data item
    let node: Node = {
        value: '',
        children: [],
    };
    for (const char of signature) {
        switch (char) {
            case '(':
                const child = {
                    value: '',
                    children: [],
                    parent: node,
                };
                node.value = 'tuple';
                node.children.push(child);
                node = child;
                break;

            case ')':
                node = node.parent as Node;
                break;

            case ',':
                const sibling = {
                    value: '',
                    children: [],
                    parent: node.parent,
                };
                (node.parent as Node).children.push(sibling);
                node = sibling;
                break;

            case ' ':
                // ignore spaces
                break;

            default:
                node.value += char;
                break;
        }
    }
    // Interpret data item from parse tree
    const dataItem = parseNode(node);
    return dataItem;
}
