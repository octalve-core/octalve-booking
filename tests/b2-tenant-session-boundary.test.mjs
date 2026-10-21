import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {trustedMutationOrigin} from '../src/server/identity/origin-policy.ts';

test('future authenticated writes must refuse missing, forged or mismatched Origin',()=>{
 const canonical='https://booking.octalvedemo.com';
 assert.equal(trustedMutationOrigin(canonical,canonical),true);
 for(const origin of [null,'','http://booking.octalvedemo.com','https://evil.example','https://booking.octalvedemo.com.evil.example','https://booking.octalvedemo.com/login','https://booking.octalvedemo.com@evil.example']){
  assert.equal(trustedMutationOrigin(origin,canonical),false,origin??'null');
 }
 assert.equal(trustedMutationOrigin(canonical,'http://booking.octalvedemo.com'),false);
});
test('server-only tenant access reads verified cookie and checks DB membership, not user supplied role',()=>{
 const code=readFileSync(new URL('../src/server/identity/workspace-authority.ts',import.meta.url),'utf8');
 assert.match(code,/await cookies\(\)/);
 assert.match(code,/currentSession\(deps,token\)/);
 assert.match(code,/assertWorkspacePermission/);
 assert.match(code,/WHERE user_id=\$1 AND workspace_id=\$2/);
 assert.doesNotMatch(code,/request\.json\(\)|\bwindow\.|localStorage|sessionStorage/);
});
