import {test} from 'node:test';
import assert from 'node:assert/strict';
import {canonical} from './owner-pin-local.mjs';
// Reference: RFC 8785 section 3.2.2 and section 3.2.3, published June 2020.
test('RFC 8785 published number and literal vector',()=>{
 const data={numbers:[333333333.33333329,1e30,4.50,2e-3,1e-27],literals:[null,true,false]};
 assert.equal(canonical(data),'{"literals":[null,true,false],"numbers":[333333333.3333333,1e+30,4.5,0.002,1e-27]}');
});
test('RFC 8785 published UTF-16 property ordering vector',()=>{
 const data={'€':'Euro Sign','\r':'Carriage Return','דּ':'Hebrew Letter Dalet With Dagesh','1':'One','😀':'Emoji: Grinning Face','\u0080':'Control','ö':'Latin Small Letter O With Diaeresis'};
 assert.deepEqual(Object.keys(JSON.parse(canonical(data))),['\r','1','\u0080','ö','€','😀','דּ']);
});
test('RFC 8785 rejects lone surrogates',()=>assert.throws(()=>canonical({bad:'\uDEAD'}),/INVALID_UNICODE/));
test('RFC 8785 rejects non-finite numbers',()=>assert.throws(()=>canonical({bad:Infinity}),/INVALID_NUMBER/));
