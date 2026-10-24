import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from '../src/app.mjs';

const token='integration-safe-token-at-least-32-chars-abc';
async function withServer(fn) {
 const server=createServer({accessToken:token});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 try {await fn('http://127.0.0.1:'+server.address().port);}
 finally {await new Promise(r=>server.close(r));}
}
async function request(base,path,{method='GET',auth=true,body}={}) {
 const r=await fetch(base+path,{method,headers:{...(auth?{Authorization:'Bearer '+token}:{}),'Content-Type':'application/json'},...(body!==undefined?{body:JSON.stringify(body)}:{})});
 return {status:r.status,data:await r.json()};
}
test('APK 1.6 sees safe-stage status, no connected social accounts',()=>withServer(async base=>{
 const r=await request(base,'/v1/status');
 assert.equal(r.status,200);
 assert.equal(r.data.aiReady,false);assert.equal(r.data.metaReady,false);
 assert.equal(r.data.publishingEnabled,false);
 assert.deepEqual(r.data.targets,[]);
}));
test('APK 1.6 account and AI calls cannot create paid requests or publish',()=>withServer(async base=>{
 assert.deepEqual((await request(base,'/v1/campaigns')).data.campaigns,[]);
 assert.equal((await request(base,'/v1/campaigns',{method:'POST',body:{}})).status,503);
 assert.equal((await request(base,'/v1/connections/meta',{method:'POST',body:{}})).status,503);
 const fake='/v1/campaigns/00000000-0000-0000-0000-000000000000';
 assert.equal((await request(base,fake+'/publish',{method:'POST',body:{confirmed:true}})).status,403);
 assert.equal((await request(base,fake+'/review',{method:'POST',body:{targets:[]}})).status,409);
}));
test('APK 1.6 routes require authorization',()=>withServer(async base=>{
 assert.equal((await request(base,'/v1/status',{auth:false})).status,401);
 assert.equal((await request(base,'/v1/campaigns',{auth:false})).status,401);
}));
