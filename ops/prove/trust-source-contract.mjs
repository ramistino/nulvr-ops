// C3 trust-source contract. Local-only; intentionally has no implementation that can mint TRUSTED.
// A caller assertion such as {origin:"INDEPENDENT_OFFLINE_READONLY"} is data, not provenance.
const deny=reason=>({status:'UNVERIFIABLE',reason,trustSourceAuthenticated:false,ledgerWrite:false,releaseAuthority:false});
export function authenticateTrustSource(input){
 if(!input||typeof input!=='object')return deny('TRUST_SOURCE_REQUIRED');
 // T2 local scope has no founder-controlled root, protected keystore, immutable acquisition
 // channel, or atomic replay store. Therefore there is no safe positive branch here.
 return deny('AUTHENTICATED_TRUST_SOURCE_NOT_IMPLEMENTED');
}
export function requireAuthenticatedTrustSource(receipt){
 if(!receipt||receipt.trustSourceAuthenticated!==true)return deny('AUTHENTICATED_TRUST_SOURCE_REQUIRED');
 // Deliberately reject caller-crafted booleans. A future implementation must replace this
 // module with cryptographically/operationally authenticated provenance before activation.
 return deny('AUTHENTICATED_TRUST_SOURCE_NOT_IMPLEMENTED');
}
