const { chromium, devices } = require('playwright'); const http=require('http'), fs=require('fs'), path=require('path');
const SP=process.env.SP, ROOT='/home/claude/mis-finanzas', D=process.env.DARK?'-dark':'';
const srv=http.createServer((q,s)=>{ let f=path.join(ROOT,decodeURIComponent(q.url.split('?')[0])); if(f.endsWith('/')) f+='index.html';
  fs.readFile(f,(e,d)=>{ if(e){s.writeHead(404);return s.end();} s.writeHead(200,{'Content-Type':{'.html':'text/html','.js':'text/javascript','.png':'image/png','.webmanifest':'application/manifest+json'}[path.extname(f)]||'application/octet-stream'}); s.end(d); }); }).listen(8124);
(async()=>{
  const dev=Object.assign({},devices['iPhone 15 Pro'],{viewport:{width:402,height:874}});
  const b=await chromium.launch(); const ctx=await b.newContext(Object.assign({},dev,{colorScheme:process.env.DARK?'dark':'light'})); const p=await ctx.newPage();
  const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
  p.on('dialog',d=>d.accept());
  await p.goto('http://localhost:8124/');
  await p.fill('#p1','secreta1'); await p.fill('#p2','secreta1'); await p.click('#lock button'); await p.waitForSelector('nav.tabs');
  await p.screenshot({path:SP+'/shots/n-1-primera-vez'+D+'.png'});
  await p.click('[data-act=iniIncome]'); await p.waitForTimeout(150); await p.screenshot({path:SP+'/shots/n-1b-sueldo'+D+'.png'}); await p.fill('#dlg [name=v]','1500'); await p.click('#dOk'); await p.waitForTimeout(200);
  // importar desde el boton +
  await p.click('nav [data-act=rapido]'); await p.waitForTimeout(200);
  await p.screenshot({path:SP+'/shots/n-2-mas-boton'+D+'.png'});
  const [fc]=await Promise.all([p.waitForEvent('filechooser'), p.click('#sheet [data-act=pickPDF]')]);
  await fc.setFiles(['revolut-ene-oct','revolut-octubre','tarjeta-sept','tr-cuenta','tr-patrimonio'].map(n=>SP+'/pdfs/'+n+'.pdf'));
  await p.waitForFunction(()=>UI.impRes.length>=5 && !UI.importando,null,{timeout:120000}); await p.waitForTimeout(200);
  await p.screenshot({path:SP+'/shots/n-2b-importar'+D+'.png',fullPage:true});
  console.log('import ok', await p.evaluate(()=>UI.impRes.map(r=>r.ok).join(',')));
  await p.click('nav [data-v=resumen]'); await p.selectOption('[data-ch=mes]','2026-10'); await p.waitForTimeout(150);
  await p.screenshot({path:SP+'/shots/n-3-inicio-sin-limite'+D+'.png',fullPage:true});
  // limites
  await p.click('nav [data-v=mas]'); await p.screenshot({path:SP+'/shots/n-4-mas'+D+'.png'});
  await p.click('.lista [data-v=presupuesto]'); 
  await p.fill('[data-bud=super]','200'); await p.dispatchEvent('[data-bud=super]','change');
  await p.evaluate(()=>{ Object.assign(S.budget,{alquiler:380,restaurantes:80,delivery:20,transporte:40,uber:20,estanco:20,videojuegos:20,suscripciones:100,master:165,ocio:50,personas:30,otros:40}); render(); });
  await p.screenshot({path:SP+'/shots/n-5-presupuesto'+D+'.png'});
  await p.click('nav [data-v=resumen]'); await p.selectOption('[data-ch=mes]','2026-11'); await p.waitForTimeout(150);
  await p.screenshot({path:SP+'/shots/n-6-inicio-nov'+D+'.png',fullPage:true});
  await p.selectOption('[data-ch=mes]','2026-10'); await p.waitForTimeout(150);
  await p.screenshot({path:SP+'/shots/n-7-inicio-oct'+D+'.png',fullPage:true});
  // alta rapida
  await p.click('nav [data-act=rapido]'); await p.fill('#rqImp','12,40'); await p.click('#sheet .qc[data-c]'); 
  await p.screenshot({path:SP+'/shots/n-8-alta'+D+'.png'});
  await p.click('#rqOk'); await p.waitForTimeout(200); console.log('toast:', await p.$eval('#toast',x=>x.textContent));
  const ult=await p.evaluate(()=>{const t=S.txs[S.txs.length-1]; return [t.d,t.imp,t.c,t.cat,t.f].join(' ');}); console.log('ultimo:',ult);
  await p.click('nav [data-v=movimientos]'); await p.selectOption('[data-ch=mes]','2026-10'); await p.waitForTimeout(150);
  await p.screenshot({path:SP+'/shots/n-10-movs'+D+'.png'});
  await p.click('.mrow >> nth=2'); await p.waitForTimeout(150); await p.screenshot({path:SP+'/shots/n-11-ficha'+D+'.png'}); await p.click('#msNo');
  await p.click('[data-act=fTipo][data-t=i]'); await p.click('[data-act=buscar]'); await p.fill('.buscar','mercadona'); await p.waitForTimeout(400); console.log('busqueda', await p.$$eval('.mrow',a=>a.length));
  await p.click('nav [data-v=mas]'); await p.click('.lista [data-v=ajustes]'); await p.screenshot({path:SP+'/shots/n-12-ajustes'+D+'.png',fullPage:true});
  await p.click('nav [data-v=mas]'); await p.click('.lista [data-v=patrimonio]'); await p.screenshot({path:SP+'/shots/n-13-patrimonio'+D+'.png',fullPage:true});
  for(const v of ['movimientos','mas']){ await p.click('nav [data-v='+v+']'); const ov=await p.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth); console.log(v,'desborde',ov); }
  for(const v of ['presupuesto','deudas','patrimonio','suscripciones','importar','ajustes']){ await p.click('nav [data-v=mas]'); await p.click('.lista [data-v='+v+']'); const ov=await p.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth); console.log(v,'desborde',ov); }
  await p.setViewportSize({width:1280,height:900}); await p.waitForTimeout(300); await p.click('nav [data-v=resumen]');
  await p.screenshot({path:SP+'/shots/n-9-escritorio'+D+'.png',fullPage:true});
  console.log('errores',errs); await b.close(); srv.close();
})().catch(e=>{console.error(e);process.exit(1)});
