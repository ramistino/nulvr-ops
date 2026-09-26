// C3 local-only raw JSON preflight; rejects duplicate decoded object keys.
export function parseStrictJson(raw) {
 if(typeof raw!=='string'||Buffer.byteLength(raw,'utf8')>16384)throw Error('RAW_JSON_INVALID');
 let i=0;const fail=()=>{throw Error('RAW_JSON_INVALID')};const ws=()=>{while(i<raw.length&&' \t\r\n'.includes(raw[i]))i++};
 const str=()=>{const start=i;if(raw[i++]!=='"')fail();while(i<raw.length){const c=raw[i++];if(c==='"'){try{return JSON.parse(raw.slice(start,i))}catch{fail()}}if(c==='\\'){const e=raw[i++];if(e==='u'){if(!/^[0-9a-fA-F]{4}$/.test(raw.slice(i,i+4)))fail();i+=4}else if(!'"\\/bfnrt'.includes(e))fail()}else if(c<' ')fail()}fail()};
 const val=()=>{ws();const c=raw[i];if(c==='"')return str();if(c==='{')return obj();if(c==='[')return arr();const m=raw.slice(i).match(/^(?:true|false|null|-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?)/);if(!m)fail();i+=m[0].length};
 const obj=()=>{i++;ws();const seen=new Set();if(raw[i]==='}'){i++;return}for(;;){ws();const key=str();if(seen.has(key))throw Error('DUPLICATE_JSON_KEY');seen.add(key);ws();if(raw[i++]!==':')fail();val();ws();if(raw[i]==='}'){i++;return}if(raw[i++]!==',')fail()}};
 const arr=()=>{i++;ws();if(raw[i]===']'){i++;return}for(;;){val();ws();if(raw[i]===']'){i++;return}if(raw[i++]!==',')fail()}};
 val();ws();if(i!==raw.length)fail();try{return JSON.parse(raw)}catch{fail()}
}
