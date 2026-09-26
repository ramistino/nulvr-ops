// Independent RFC 8785 §3.2.2 and Appendix B reference vectors.
// C3 intentionally disallows unsafe integer-valued IEEE754 numbers; not full RFC 8785 interoperability.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {canonical} from './owner-pin-local.mjs';

test('RFC 8785 sample: supported string, literal and fractional number serialization',()=>{
 const input=JSON.parse(String.raw`{"numbers":[333333333.33333329,4.50,2e-3,0.000000000000000000000000001],"string":"\u20ac$\u000F\u000aA'\u0042\u0022\u005c\\\"\/","literals":[null,true,false]}`);
 const expected=JSON.parse(String.raw`{"literals":[null,true,false],"numbers":[333333333.3333333,4.5,0.002,1e-27],"string":"\u20ac$\u000F\u000aA'\u0042\u0022\u005c\\\"\/"}`);
 const expectedText='{"literals":[null,true,false],"numbers":[333333333.3333333,4.5,0.002,1e-27],"string":'+JSON.stringify(expected.string)+'}';
 assert.equal(canonical(input),expectedText);
});
test('RFC 8785 Unicode keys use UTF-16 sort order',()=>{
 const input=JSON.parse(String.raw`{"\u20ac":"Euro Sign","\r":"Carriage Return","\ufb33":"Hebrew Letter Dalet With Dagesh","1":"One","\ud83d\ude00":"Emoji: Grinning Face","\u0080":"Control","\u00f6":"Latin Small Letter O With Diaeresis"}`);
 const output=canonical(input);
 const expectedKeys=['\\r','1','\u0080','ö','€','😀','דּ'];
 const positions=expectedKeys.map(k=>output.indexOf('"'+k+'":'));
 assert.ok(positions.every(p=>p>=0),JSON.stringify({output,positions}));
 assert.deepEqual(positions,positions.toSorted((a,b)=>a-b));
});
test('RFC 8785 Appendix B supported IEEE754 boundary representations',()=>{
 const cases=[['0000000000000000','0'],['8000000000000000','0'],['0000000000000001','5e-324'],['8000000000000001','-5e-324']];
 for(const [hex,expected] of cases)assert.equal(canonical(Buffer.from(hex,'hex').readDoubleBE(0)),expected,hex);
});
test('C3 rejects representable but unsafe integer-valued doubles',()=>{
 for(const hex of ['7fefffffffffffff','44b52d02c7e14af5','44b52d02c7e14af6'])assert.throws(()=>canonical(Buffer.from(hex,'hex').readDoubleBE(0)),/INVALID_NUMBER/);
});
test('RFC 8785 forbids nonfinite and lone surrogate inputs',()=>{
 for(const v of [NaN,Infinity,-Infinity,'\uD800','\uDC00'])assert.throws(()=>canonical(v));
});
