import { spawnSync } from 'node:child_process';
const cases=[['node',['--check','public/booking.js']],['node',['--test','tests/booking-policy.test.mjs','tests/source-safety.test.mjs']]];
for(const [bin,args] of cases){const p=spawnSync(bin,args,{stdio:'inherit'});if(p.error||p.status!==0)process.exit(p.status||1)}
