import { getByXPath } from '@/lib/scraping/xpath';
import {
    BrandedAction,
    BrandedEntry,
    BrandedFilter,
    ExpandUntil,
    IsEntry,
    brandedAction,
    brandedEntries,
    brandedFilter,
    conjugateEntries,
    fromBrandedEntries
} from '@/lib/fn';

type ElementValueField = 'textContent' | 'innerText' | 'outerText' | 'outerHTML' | 'innerHTML';

type BaseScrapingNode = {
    path: string
    node?: true // TODO: revisit this
    attributes?: Record<string, string>
    value?: ElementValueField
    children?: ScrapingSchema
};

type ScrapingNode = BaseScrapingNode | readonly [BaseScrapingNode];

export type ScrapingSchema = Record<string, ScrapingNode>;

/*
type BaseScrapingNodeInput<BSN extends BaseScrapingNode> = {
    path: string
    attributes?: BSN['attributes']
    value?: BSN['value']
    children?: BSN['children']
}; //  Partial<BSN> & { path: BSN['path'] };

type ScrapingNodeInput<SN extends ScrapingNode> = (
    SN extends readonly [BaseScrapingNode]
    ? readonly [BaseScrapingNodeInput<SN[0]>]
    : SN extends BaseScrapingNode
    ? BaseScrapingNodeInput<SN>
    : never
);

export type ScrapingSchemaInput<S extends ScrapingSchema> = {
    [K in keyof S]: (
        K extends string
        ? ScrapingNodeInput<S[K]>
        : never
    )
}

const fromNodeInput = <
    SN extends ScrapingNode,
    Input extends ScrapingNodeInput<SN>
>(input: Input): SN => (
    0 in input
        ? [fromNodeInput(input[0])]
        : ({
            path: input.path,
            value: input?.value ?? 'textContent',
            attributes: input?.attributes ?? {},
            children: input.children
                ? conjugateEntries(
                    input.children,
                    ([k, v]) => [k, fromNodeInput(v)]
                )
                : {},
        })
) as SN; // READ: https://github.com/microsoft/TypeScript/issues/24085

const fromSchemaInput = <
    Schema extends ScrapingSchema,
    Input extends ScrapingSchemaInput<Schema>
>(schema: Input): Schema => (
    conjugateEntries(
        schema,
        ([k, v]) => [k as string, fromNodeInput(v)] // TODO: fix this?
    )
);

export function snapshotSchema<
    Schema extends ScrapingSchema,
    Input extends ScrapingSchemaInput<Schema>
>(
    input: Input,
    baseNode: HTMLElement | Document = document
) {
    return _snapshotSchema<Schema>(fromSchemaInput(input), baseNode);
}

*/

// TODO: for the love of god find a better name
type NodeArity<SN extends ScrapingNode, U, V = U[]> = SN extends readonly [BaseScrapingNode] ? V : U;

// TODO: also reconsider this name (?)
type ExtractNode<SN extends ScrapingNode> = SN extends readonly [BaseScrapingNode] ? SN[0] : SN;

type BaseScrapingNodeSnapshot<BSN extends BaseScrapingNode> = (
    Pick<{
        node: HTMLElement
        value: string | null
        attributes: Record<keyof BSN['attributes'], string | null>
        children: (
            BSN['children'] extends ScrapingSchema
            ? ScrapingSchemaSnapshot<BSN['children']>
            : {})
    }, Exclude<keyof (BSN | BaseScrapingNode), 'path'>>
);

type ScrapingNodeSnapshot<SN extends ScrapingNode> = (
    NodeArity<
        SN,
        BaseScrapingNodeSnapshot<ExtractNode<SN>>
    >
);

export type ScrapingSchemaSnapshot<Schema extends ScrapingSchema> = {
    [K in keyof Schema]: ScrapingNodeSnapshot<Schema[K]>
}

const snapshotAttributes = <BSN extends BaseScrapingNode>(
    bsn: BSN,
    node: HTMLElement
) => (
    conjugateEntries<
        BSN['attributes'],
        Record<keyof BSN['attributes'], string | null>
    >(
        bsn.attributes ?? {},
        ([k, v]) => [k, node.getAttribute(v as string)] // TODO: use liftAction; fix this
    )
);

const snapshotBaseNode = <BSN extends BaseScrapingNode>(
    bsn: BSN,
    node: HTMLElement
): BaseScrapingNodeSnapshot<BSN> => {
    /*
     * TODO: we have to do this because I failed to constrain:
     * keyof BSN extends keyof Required<BaseScrapingNode>
     * 
     * We filter T to U, then map U to V
     */
    type T = BSN;
    type U = Pick<BSN, Exclude<keyof BaseScrapingNode, 'path'>>;
    type V = BaseScrapingNodeSnapshot<BSN>

    // TODO: desisto, depois arrumar isso aq
    const filter: BrandedFilter<T, U> = (
        <Entry extends BrandedEntry<T>>([k, v]: Entry) => (
            (
                ['node', 'value', 'attributes', 'children'].includes(k as string)
                && v
            ) as IsEntry<Entry, U>
        )
    )

    // TODO: rethink this as well
    const action: BrandedAction<U, V> = ([k, v]: BrandedEntry<U>) => {
        // TODO: this is happening because of optional keys; handle it better
        if (v === undefined) {
            throw new Error('unreachable state')
        }

        // at this point k's type has already collapsed between any relationship with T
        switch (k) {
            // TODO: it would be nice if we could do "as BrandedEntry<Pick<V, 'node'>>"
            case 'node': return [k, node] as BrandedEntry<V>;
            case 'value': return [k, node[v]] as BrandedEntry<V>;
            case 'attributes': return [k, snapshotAttributes(bsn, node)] as BrandedEntry<V>;
            case 'children': return [k, snapshotSchema(v ?? {}, node)] as BrandedEntry<V>;
        }
    }

    return fromBrandedEntries(
        brandedAction(
            brandedFilter(
                brandedEntries(bsn),
                filter
            ),
            action
        )
    )
};

const snapshotNode = <SN extends ScrapingNode>(
    sn: SN,
    baseNode: HTMLElement | Document
): ScrapingNodeSnapshot<SN> => {
    // READ: https://github.com/microsoft/TypeScript/issues/24085
    if ('0' in sn) {
        const ssn = sn[0];
        const nodes = getByXPath(ssn.path, baseNode);
        const snapshot = nodes.map(node => snapshotBaseNode(ssn, node));

        return snapshot as ScrapingNodeSnapshot<SN>;
    } else {
        const node = getByXPath(sn.path, baseNode)[0];
        const snapshot = snapshotBaseNode(sn, node);

        return snapshot as ScrapingNodeSnapshot<SN>;
    }
}

export function snapshotSchema<Schema extends ScrapingSchema>(
    schema: Schema,
    baseNode: HTMLElement | Document = document,
): ScrapingSchemaSnapshot<Schema> {
    return conjugateEntries<Schema, ScrapingSchemaSnapshot<Schema>>(
        schema,
        ([k, v]) => [k, snapshotNode(v, baseNode)] // TODO: use liftAction
    );
}

// Expands the schema's snapshot until HTMLElement, for better legibility
export type ExpandedSnapshot<Schema extends ScrapingSchema> = (
    ExpandUntil<ScrapingSchemaSnapshot<Schema>, HTMLElement>
);
