const { chromium } = require('playwright');
const SP=process.env.SP;
(async()=>{
  const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:1280,height:900}, colorScheme:process.env.DARK?'dark':'light'});
  const p=await ctx.newPage(); const errs=[]; const reqs=[];
  p.on('console',m=>{ if(m.type()==='error'||m.type()==='warning') errs.push(m.type()+': '+m.text()); });
  p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
  p.on('request',r=>{ if(!r.url().startsWith('file:')&&!r.url().startsWith('data:')&&!r.url().startsWith('blob:')) reqs.push(r.url()); });
  p.on('dialog',d=>d.accept('secreta1'));
  await p.goto('file:///home/claude/finanzas/dist/MisFinanzas/MisFinanzas.html');
  console.log('secure',await p.evaluate(()=>window.isSecureContext));
  await p.fill('#p1','secreta1'); await p.fill('#p2','secreta1'); await p.click('#lock button');
  await p.waitForSelector('nav button');
  await p.click('[data-v=importar]');
  const t0=Date.now();
  await p.setInputFiles('#fi',['revolut-ene-oct','revolut-octubre','tarjeta-sept','tr-cuenta','tr-patrimonio','personalizado','nomina'].map(n=>SP+'/pdfs/'+n+'.pdf'));
  await p.waitForFunction(()=>UI.impRes.length>=7 && !UI.importando,null,{timeout:120000});
  console.log('import ms',Date.now()-t0);
  console.log(await p.evaluate(()=>UI.impRes.map(r=>(r.ok?r.f.tipo+' '+r.f.nuevos+' nuevos '+r.f.dup+' dup':r.nombre)+' '+r.avisos.join('/')).join('\n')));
  await p.screenshot({path:SP+'/shots/importar.png',fullPage:true});
  // reimportar: todo duplicado
  await p.setInputFiles('#fi',[SP+'/pdfs/revolut-octubre.pdf']); await p.waitForFunction(()=>UI.impRes.length===1 && !UI.importando,null,{timeout:60000});
  console.log('REIMPORT:',await p.evaluate(()=>{const r=UI.impRes[0]; return r.ok?r.f.nuevos+' nuevos '+r.f.dup+' dup':r.avisos.join('/');}));
  for(const [v,mes] of [['resumen','2026-10'],['resumen','2026-11'],['movimientos','2026-10'],['presupuesto','2026-10'],['deudas'],['patrimonio'],['suscripciones'],['ajustes']]){
    await p.click('[data-v='+v+']'); if(mes){ await p.selectOption('[data-ch=mes]',mes); }
    await p.waitForTimeout(150); await p.screenshot({path:SP+'/shots/'+v+(mes?'-'+mes:'')+(process.env.DARK?'-dark':'')+'.png',fullPage:true});
  }
  // aprender categoria
  await p.click('[data-v=movimientos]'); await p.selectOption('[data-ch=mes]','2026-10');
  await p.click('[data-act=buscar]'); await p.fill('[data-in=fTxt]','teika'); await p.waitForTimeout(500);
  const nT=await p.$$eval('.mrow',a=>a.length); await p.click('.mrow >> nth=0'); await p.click('#sheet .chip[data-c=ocio]'); await p.waitForTimeout(200);
  console.log('APRENDE:',nT,'teika ->', await p.evaluate(()=>S.txs.filter(t=>/teika/i.test(t.d)).map(t=>t.cat).join(',')));
  // movimiento manual + plantilla
  await p.click('nav [data-act=rapido]'); await p.fill('#rqImp','12,50'); await p.click('#sheet .qc[data-c]'); await p.click('#rqOk'); await p.waitForTimeout(150);
  await p.click('[data-v=ajustes]'); await p.click('details.ad summary >> nth=0'); await p.fill('#plMes','2026-10'); await p.click('[data-act=aplicarPl]'); await p.waitForTimeout(200);
  console.log('TOAST:',await p.$eval('#toast',x=>x.textContent));
  await p.click('[data-v=resumen]'); await p.selectOption('[data-ch=mes]','2026-10'); await p.screenshot({path:SP+'/shots/resumen-con-bbva.png',fullPage:true});
  console.log('HERO:',await p.$eval('.hero',x=>x.innerText.replace(/\n/g,' / ')));
  const st=await p.evaluate(()=>({n:S.txs.length, cats:(()=>{const m={};S.txs.forEach(t=>{m[t.cat]=(m[t.cat]||0)+1});return m})(), otros:S.txs.filter(t=>t.cat==='otros'||t.cat==='otros_ing').map(t=>t.d+' '+t.imp).slice(0,80)}));
  console.log(JSON.stringify(st.cats)); console.log('OTROS',st.otros.length, st.otros.join(' ; '));
  // persistencia + bloqueo
  await p.waitForTimeout(600); await p.reload(); await p.fill('#p1','mala'); await p.click('#lock button'); await p.waitForTimeout(1500); console.log('mala:',await p.$eval('#lock .err',x=>x.textContent));
  await p.fill('#p1','secreta1'); await p.click('#lock button'); await p.waitForSelector('nav button'); console.log('tras recargar txs:',await p.evaluate(()=>S.txs.length));
  const raw=await p.evaluate(async()=>{const v=await idbGet('data'); return Object.keys(v).join(',')+' ct bytes '+v.ct.length+' plaintext? '+(new TextDecoder().decode(v.ct.slice(0,200)).includes('txs'));}); console.log('IDB:',raw);
  console.log('errores:',errs.slice(0,10)); console.log('peticiones externas:',reqs);
  await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
