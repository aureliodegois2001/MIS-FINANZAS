// Prueba de sincronización: dos "dispositivos" con datos distintos se juntan sin perder ni duplicar.
const { chromium } = require('playwright'); const http=require('http'), fs=require('fs'), path=require('path');
const SP=process.env.SP, ROOT='/home/claude/mis-finanzas';
const srv=http.createServer((q,s)=>{ let f=path.join(ROOT,decodeURIComponent(q.url.split('?')[0])); if(f.endsWith('/')) f+='index.html';
  fs.readFile(f,(e,d)=>{ if(e){s.writeHead(404);return s.end();} s.writeHead(200,{'Content-Type':{'.html':'text/html','.js':'text/javascript'}[path.extname(f)]||'application/octet-stream'}); s.end(d); }); }).listen(8125);
async function dispositivo(b, pdfs){
  const ctx=await b.newContext({viewport:{width:402,height:874}}); const p=await ctx.newPage(); const errs=[];
  p.on('pageerror',e=>errs.push(e.message)); p.on('dialog',d=>d.accept(d.type()==='prompt'?'secreta1':undefined));
  await p.goto('http://localhost:8125/'); await p.fill('#p1','secreta1'); await p.fill('#p2','secreta1'); await p.click('#lock button'); await p.waitForSelector('nav');
  await p.evaluate(()=>{ UI.vista='importar'; render(); });
  await p.setInputFiles('#fi', pdfs.map(n=>SP+'/pdfs/'+n+'.pdf'));
  await p.waitForFunction(n=>UI.impRes.length>=n && !UI.importando, pdfs.length, {timeout:120000});
  p.errs=errs; return p;
}
const resumen=p=>p.evaluate(()=>{ const k=S.txs.map(t=>clave(t)+'|'+t.cat).sort(); return {n:S.txs.length, files:S.files.length, h:k.join('\n').length, income:S.income, sub:S.subs.length, keys:k}; });
(async()=>{
  const b=await chromium.launch();
  const A=await dispositivo(b,['revolut-ene-oct','tarjeta-sept']);
  const B=await dispositivo(b,['revolut-ene-oct','revolut-octubre','tr-cuenta']);
  // cambios propios en cada uno
  await A.evaluate(()=>{ S.txs.push({id:S.nextId++, f:'2026-11-05', c:'bbva', d:'Gasto A', det:'', imp:-10, sal:null, cat:'super', man:1, src:'manual', ord:'x'}); var t=S.txs.find(t=>/mercadona/i.test(t.d)); cambiarCat(t.id,'ocio'); guardar(); });
  await B.evaluate(()=>{ S.txs.push({id:S.nextId++, f:'2026-11-06', c:'efectivo', d:'Gasto B', det:'', imp:-5, sal:null, cat:'ocio', man:1, src:'manual', ord:'y'}); S.income=1500; S.ajTs=Date.now(); guardar(); });
  await new Promise(r=>setTimeout(r,300));
  const a0=await resumen(A), b0=await resumen(B); console.log('antes  A',a0.n,a0.files,' B',b0.n,b0.files);
  // B -> A -> B (como haría el archivo en iCloud)
  const pB=await B.evaluate(()=>empaquetar());
  const r1=await A.evaluate(async t=>{ const r=await aplicarPaquete(t); return r; }, pB); console.log('A junta B:',JSON.stringify(r1));
  const pA=await A.evaluate(()=>empaquetar());
  const r2=await B.evaluate(async t=>await aplicarPaquete(t), pA); console.log('B junta A:',JSON.stringify(r2));
  let a1=await resumen(A), b1=await resumen(B);
  console.log('después A',a1.n,a1.files,a1.income,' B',b1.n,b1.files,b1.income,' iguales:',a1.keys.join()===b1.keys.join());
  console.log('mercadona->ocio en B:', await B.evaluate(()=>S.txs.filter(t=>/mercadona/i.test(t.d)).every(t=>t.cat==='ocio')));
  // segunda vuelta: nada cambia, y ya no pide contraseña (misma clave)
  const r3=await A.evaluate(async t=>await aplicarPaquete(t), await B.evaluate(()=>empaquetar())); console.log('2ª vuelta:',JSON.stringify(r3));
  // borrar en B se propaga a A
  await B.evaluate(()=>{ var t=S.txs.find(t=>t.d==='Gasto A'); borrado(t); S.txs=S.txs.filter(x=>x!==t); var f=S.files.find(f=>/Tarjeta/.test(f.tipo)); borrarFichero(f.id); guardar(); });
  const r4=await A.evaluate(async t=>await aplicarPaquete(t), await B.evaluate(()=>empaquetar())); console.log('borrados:',JSON.stringify(r4));
  a1=await resumen(A); b1=await resumen(B); console.log('final A',a1.n,a1.files,' B',b1.n,b1.files,' iguales:',a1.keys.join()===b1.keys.join());
  // la sesión sigue funcionando tras cambiar de clave
  await A.reload(); await A.fill('#p1','secreta1'); await A.click('#lock button'); await A.waitForSelector('nav'); console.log('A tras recargar', await A.evaluate(()=>S.txs.length));
  console.log('errores', A.errs, B.errs); await b.close(); srv.close();
})().catch(e=>{console.error(e);process.exit(1)});
