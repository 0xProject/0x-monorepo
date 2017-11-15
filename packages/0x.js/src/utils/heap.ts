// Based on Original JavaScript Code from  Marijn Haverbeke (http://eloquentjavascript.net/1st_edition/appendix2.html)
export class Heap<T> {
    private content: T[];
    private scoreFunction: (x: T) => number;
    constructor(scoreFunction: (x: T) => number) {
        this.content = [];
        this.scoreFunction = scoreFunction;
    }
    public push(element: T) {
        this.content.push(element);
        this.bubbleUp(this.content.length - 1);
    }
    public size(): number {
        const size = this.content.length;
        return size;
    }
    public head(): T {
        const head = this.content[0];
        return head;
    }
    public pop(): T {
        const head = this.content[0];
        const end = this.content.pop();
        if (this.content.length > 0) {
            this.content[0] = end as T;
            this.sinkDown(0);
        }
        return head;
    }
    private bubbleUp(n: number) {
        // Fetch the element that has to be moved.
        const element = this.content[n];
        const score = this.scoreFunction(element);
        // When at 0, an element can not go up any further.
        while (n > 0) {
            // Compute the parent element's index, and fetch it.
            const parentN = Math.floor((n + 1) / 2) - 1;
            const parent = this.content[parentN];
            // If the parent has a lesser score, things are in order and we
            // are done.
            if (score >= this.scoreFunction(parent)) {
                break;
            }

            // Otherwise, swap the parent with the current element and
            // continue.
            this.content[parentN] = element;
            this.content[n] = parent;
            n = parentN;
        }
    }

    private sinkDown(n: number) {
        // Look up the target element and its score.
        const length = this.content.length;
        const element = this.content[n];
        const elemScore = this.scoreFunction(element);

        while (true) {
            // Compute the indices of the child elements.
            const child2N = (n + 1) * 2;
            const child1N = child2N - 1;
            // This is used to store the new position of the element, if any.
            let swap = n;
            let child1Score;
            let child2Score;
            // If the first child exists (is inside the array)...
            if (child1N < length) {
                // Look it up and compute its score.
                const child1 = this.content[child1N];
                child1Score = this.scoreFunction(child1);
                // If the score is less than our element's, we need to swap.
                if (child1Score < elemScore) {
                    swap = child1N;
                }
                // Do the same checks for the other child.
                if (child2N < length) {
                    const child2 = this.content[child2N];
                    child2Score = this.scoreFunction(child2);
                    if (child2Score < (swap == null ? elemScore : child1Score)) {
                        swap = child2N;
                    }
                }
            }
            this.content[n] = this.content[swap];
            this.content[swap] = element;
            n = swap;
        }
    }
}
