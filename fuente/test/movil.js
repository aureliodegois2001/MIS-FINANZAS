const { chromium, devices } = require('playwright'); const http=require('http'), fs=require('fs'), path=require('path');
const SP=process.env.SP, ROOT='/home/claude/mis-finanzas';
const srv=http.createServer((q,s)=>{ let f=path.join(ROOT,decodeURIComponent(q.url.split('?')[0])); if(f.endsWith('/')) f+='index.html';
  fs.readFile(f,(e,d)=>{ if(e){s.writeHead(404);return s.end();} s.writeHead(200,{'Content-Type':{'.html':'text/html','.js':'text/javascript','.png':'image/png','.webmanifest':'application/manifest+json'}[path.extname(f)]||'application/octet-stream'}); s.end(d); }); }).listen(8123);
(async()=>{
  const dev=Object.assign({},devices['iPhone 15 Pro'],{viewport:{width:402,height:874}});
  const b=await chromium.launch(); const ctx=await b.newContext(Object.assign({},dev,{colorScheme:process.env.DARK?'dark':'light'})); const p=await ctx.newPage();
  const errs=[], reqs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
  p.on('request',r=>{ if(!r.url().startsWith('http://localhost:8123')&&!/^(data|blob):/.test(r.url())) reqs.push(r.url()); });
  p.on('dialog',d=>d.accept('secreta1'));
  await p.goto('http://localhost:8123/');
  await p.screenshot({path:SP+'/shots/m-lock.png'});
  await p.fill('#p1','secreta1'); await p.fill('#p2','secreta1'); await p.click('#lock button'); await p.waitForSelector('nav button');
  console.log('sw', await p.evaluate(async()=>{ const r=await navigator.serviceWorker.ready; return !!r.active; }));
  console.log('estado inicial', await p.evaluate(()=>JSON.stringify({income:S.income,subs:S.subs.length,debts:S.debts.length,pl:S.plantilla.length,dia:S.diaInicio,budget:Object.keys(S.budget).length})));
  await p.click('[data-v=importar]');
  await p.setInputFiles('#fi',['revolut-ene-oct','revolut-octubre','tarjeta-sept','tr-cuenta','tr-patrimonio'].map(n=>SP+'/pdfs/'+n+'.pdf'));
  await p.waitForSelector('.card h2:has-text("Resultado")',{timeout:120000});
  console.log(await p.$$eval('.alert',a=>a.map(x=>x.innerText.replace(/\n/g,' | ')).join('\n')));
  for(const v of ['resumen','movimientos','presupuesto','deudas','patrimonio','suscripciones','ajustes']){
    await p.click('[data-v='+v+']'); await p.waitForTimeout(150);
    const ov=await p.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
    console.log(v,'desborde horizontal',ov);
    await p.screenshot({path:SP+'/shots/m-'+v+(process.env.DARK?'-dark':'')+'.png',fullPage:v!=='movimientos'});
  }
  await p.click('[data-v=movimientos]'); await p.click('[data-act=nuevoMov]'); await p.screenshot({path:SP+'/shots/m-dialog.png'}); await p.click('#dNo');
  // offline: recargar sin red
  await ctx.setOffline(true); await p.reload(); await p.waitForSelector('#lock input'); console.log('abre sin conexión: OK');
  await p.fill('#p1','secreta1'); await p.click('#lock button'); await p.waitForSelector('nav button'); console.log('datos sin conexión', await p.evaluate(()=>S.txs.length));
  console.log('errores',errs); console.log('externas',reqs);
  await b.close(); srv.close();
})().catch(e=>{console.error(e);process.exit(1)});
