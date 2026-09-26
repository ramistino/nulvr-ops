import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseStrictJson} from './raw-json-preflight.mjs';
const valid=['{}','[]','{"a":1,"b":{"a":2}}','{"a":[{"a":1},{"a":2}]}','{"a":1,"\\u0062":2}','{"escaped\\\"key":1}','{"a":true,"b":false,"c":null,"d":-1.25e+3}','[1,2,3,{"x":"\\uD83D\\uDE00"}]'];
valid.forEach((s,i)=>test('valid JSON '+i,()=>assert.deepEqual(parseStrictJson(s),JSON.parse(s))));
const invalid=[['{"a":1,"a":2}','DUPLICATE_JSON_KEY'],['{"a":1,"\\u0061":2}','DUPLICATE_JSON_KEY'],['{"x":{"z":1,"z":2}}','DUPLICATE_JSON_KEY'],['[{"a":1,"a":2}]','DUPLICATE_JSON_KEY'],['{"a":1,}','RAW_JSON_INVALID'],['{"a" 1}','RAW_JSON_INVALID'],['[1,]','RAW_JSON_INVALID'],['{"a":"\\q"}','RAW_JSON_INVALID'],['{"a":01}','RAW_JSON_INVALID'],['{"a":1} {"b":2}','RAW_JSON_INVALID'],['{"a":1','RAW_JSON_INVALID'],['{"a":1} trailing','RAW_JSON_INVALID']];
invalid.forEach(([s,reason],i)=>test('reject '+i,()=>assert.throws(()=>parseStrictJson(s),new RegExp(reason))));
test('reject over 16 KiB',()=>assert.throws(()=>parseStrictJson(' '.repeat(16385)),/RAW_JSON_INVALID/));
