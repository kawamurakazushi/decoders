// @flow strict

import { serialize as serializeInline, summarize } from 'debrief';
import type { Annotation } from 'debrief';

import type { Decoder, Guard } from './types';

type Options = {|
    style?:
        | 'inline' // `inline` is the default
        | 'simple' // `simple` does not echo back the input object in error messages
        | 'noop', // `noop` performs no runtime checking (useful in production)
|};

/**
 * Alternative for serialize() that does not echo back the input value.
 */
function serializeSimple(annotation: Annotation) {
    return summarize(annotation).join('\n');
}

function noguard<T>(decoder: Decoder<T>): Guard<T> {
    return (blob: mixed) =>
        // $FlowFixMe - we take full responsibility
        ((blob: any): T);
}

export function guard<T>(decoder: Decoder<T>, options?: Options): Guard<T> {
    const o = options || {};
    const style = o.style || 'inline';

    if (style === 'noop') {
        return noguard(decoder);
    }

    const serializer =
        style === 'inline'
            ? serializeInline // Normal serializer, which echoes back inputted value and inlines errors
            : serializeSimple; // Only returns error messages, without echoing back input

    return (blob: mixed) =>
        decoder(blob)
            .mapError(annotation => {
                const err = new Error('\n' + serializer(annotation));
                err.name = 'Decoding error';
                return err;
            })
            .unwrap();
}
