import {test} from 'node:test';
import assert from 'node:assert/strict';
import {authenticateTrustSource,requireAuthenticatedTrustSource} from './trust-source-contract.mjs';

test('missing trust source fails closed',()=>assert.equal(authenticateTrustSource().reason,'TRUST_SOURCE_REQUIRED'));
test('caller provenance label cannot authenticate itself',()=>{
 const r=authenticateTrustSource({origin:'INDEPENDENT_OFFLINE_READONLY'});
 assert.equal(r.status,'UNVERIFIABLE'); assert.equal(r.trustSourceAuthenticated,false);
});
test('caller-crafted authenticated boolean is rejected',()=>{
 const r=requireAuthenticatedTrustSource({trustSourceAuthenticated:true});
 assert.equal(r.status,'UNVERIFIABLE'); assert.equal(r.reason,'AUTHENTICATED_TRUST_SOURCE_NOT_IMPLEMENTED');
});
test('untrusted receipt is rejected',()=>assert.equal(requireAuthenticatedTrustSource({trustSourceAuthenticated:false}).reason,'AUTHENTICATED_TRUST_SOURCE_REQUIRED'));
test('contract can never grant ledger or release authority',()=>{
 for(const r of [authenticateTrustSource({}),requireAuthenticatedTrustSource({trustSourceAuthenticated:true})]){
  assert.equal(r.ledgerWrite,false); assert.equal(r.releaseAuthority,false);
 }
});
