// Flujo de iPhone: Más › Sincronizar › elegir archivo › guardar de nuevo.
const { chromium, devices } = require('playwright'); const http=require('http'), fs=require('fs'), path=require('path');
const SP=process.env.SP, ROOT='/home/claude/mis-finanzas';
const srv=http.createServer((q,s)=>{ let f=path.join(ROOT,decodeURIComponent(q.url.split('?')[0])); if(f.endsWith('/')) f+='index.html';
  fs.readFile(f,(e,d)=>{ if(e){s.writeHead(404);return s.end();} s.writeHead(200,{'Content-Type':{'.html':'text/html','.js':'text/javascript'}[path.extname(f)]||'application/octet-stream'}); s.end(d); }); }).listen(8126);
(async()=>{
  const b=await chromium.launch();
  const dev=Object.assign({},devices['iPhone 15 Pro'],{viewport:{width:402,height:874}});
  // "ordenador": crea el archivo de sincronización
  const pc=await (await b.newContext({acceptDownloads:true})).newPage(); pc.on('dialog',d=>d.accept('secreta1'));
  await pc.goto('http://localhost:8126/'); await pc.fill('#p1','secreta1'); await pc.fill('#p2','secreta1'); await pc.click('#lock button'); await pc.waitForSelector('nav');
  await pc.evaluate(()=>{ S.txs.push({id:S.nextId++, f:'2026-11-05', c:'bbva', d:'Desde el PC', det:'', imp:-20, sal:null, cat:'super', man:1, src:'manual', ord:'x'}); guardar(); });
  const txt=await pc.evaluate(()=>empaquetar()); fs.writeFileSync(SP+'/mis-finanzas-sync.mfin', txt);
  // iPhone
  const ctx=await b.newContext(dev); const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('dialog',d=>d.accept('secreta1'));
  await p.goto('http://localhost:8126/'); await p.fill('#p1','secreta1'); await p.fill('#p2','secreta1'); await p.click('#lock button'); await p.waitForSelector('nav.tabs');
  await p.click('nav [data-v=mas]'); await p.screenshot({path:SP+'/shots/s-1-mas.png'});
  await p.evaluate(()=>{ FS_OK=false; });
  const [fc]=await Promise.all([p.waitForEvent('filechooser'), p.click('[data-act=sync]')]); await fc.setFiles(SP+'/mis-finanzas-sync.mfin');
  await p.waitForSelector('#sheet[open] #sgOk'); await p.screenshot({path:SP+'/shots/s-2-sync.png'});
  console.log('mensaje:', await p.$eval('#sheet .mhn',x=>x.textContent), '| tiene mov del PC:', await p.evaluate(()=>S.txs.some(t=>t.d==='Desde el PC')));
  await p.click('#sgNo'); await p.click('nav [data-v=mas]'); await p.click('.lista [data-v=ajustes]'); await p.screenshot({path:SP+'/shots/s-3-ajustes.png'});
  console.log('errores',errs); await b.close(); srv.close();
})().catch(e=>{console.error(e);process.exit(1)});
