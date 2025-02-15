export const evaluateXPath = (xpath: string, node: Node | null) => (
    document.evaluate(
        xpath,
        node!, // TODO: tirar essa gambiarra
        null,
        XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
        null
    )
);

export function getByXPath(xpath: string, node: Node | null = document) {
    const snapshot = evaluateXPath(xpath, node);

    const elements: HTMLElement[] = [];
    for (let i = 0; i < snapshot.snapshotLength; ++i) {
        let node = snapshot.snapshotItem(i);
        elements.push(node as HTMLElement); // TODO: tirar essa tb
    }

    return elements
}

/* JS version we can dump on the console:
function getByXPath(xpath, node = document) {
    const snapshot = document.evaluate(xpath, node, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
    return Array.from({ length: snapshot.snapshotLength }).map((_, i) => snapshot.snapshotItem(i));
}
*/