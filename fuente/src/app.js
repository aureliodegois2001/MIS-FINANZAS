'use strict';
/* ================= Mis Finanzas: logica de la app ================= */
var $ = function(s, r){ return (r||document).querySelector(s); };
var $$ = function(s, r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); };
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
var fmtE = new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'});
var fmtE0 = new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR',maximumFractionDigits:0});
function eur(n){ return fmtE.format(Math.abs(n)<0.005?0:n); }
function eur0(n){ return fmtE0.format(Math.round(n)); }
function r2(n){ return Math.round(n*100)/100; }
function hoy(){ var d=new Date(); return d.getFullYear()+'-'+p2(d.getMonth()+1)+'-'+p2(d.getDate()); }
function p2(n){ return (n<10?'0':'')+n; }
var MES_N = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
var MES_C = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
function mesLargo(ym){ return MES_N[+ym.slice(5,7)-1]+' de '+ym.slice(0,4); }
function mesCorto(ym){ return MES_C[+ym.slice(5,7)-1]+' '+ym.slice(2,4); }
function fechaCorta(f){ return +f.slice(8,10)+' '+MES_C[+f.slice(5,7)-1]+(f.slice(0,4)!==hoy().slice(0,4)?' '+f.slice(2,4):''); }
function finDeMes(ym){ var y=+ym.slice(0,4), m=+ym.slice(5,7); return ym+'-'+p2(new Date(y,m,0).getDate()); }
function mesSig(ym,d){ var y=+ym.slice(0,4), m=+ym.slice(5,7)-1+d; var dt=new Date(y,m,1); return dt.getFullYear()+'-'+p2(dt.getMonth()+1); }
function diaIni(){ var d=+(S&&S.diaInicio)||1; return Math.min(28,Math.max(1,d)); }
function mesDe(f){ var D=diaIni(), ym=f.slice(0,7), d=+f.slice(8,10); if(D<=1) return ym; if(D>=15) return d>=D ? mesSig(ym,1) : ym; return d>=D ? ym : mesSig(ym,-1); }
function rango(ym){ var D=diaIni(); if(D<=1) return {ini:ym+'-01', fin:finDeMes(ym)}; if(D>=15) return {ini:mesSig(ym,-1)+'-'+p2(D), fin:ym+'-'+p2(D-1)}; return {ini:ym+'-'+p2(D), fin:mesSig(ym,1)+'-'+p2(D-1)}; }
function mesEtq(ym){ if(diaIni()<=1) return mesLargo(ym); var r=rango(ym); return mesLargo(ym)+' ('+(+r.ini.slice(8))+' '+MES_C[+r.ini.slice(5,7)-1]+' – '+(+r.fin.slice(8))+' '+MES_C[+r.fin.slice(5,7)-1]+')'; }
function toNum(s){ if(typeof s==='number') return s; s=String(s||'').trim().replace(/\s|€/g,''); if(/,/.test(s)) s=s.replace(/\./g,'').replace(',','.'); var v=parseFloat(s); return isNaN(v)?0:v; }

/* ---------- datos por defecto ---------- */
var CUENTAS = [
  {id:'revolut', n:'Revolut', auto:true},
  {id:'revolut_apartados', n:'Revolut · Apartados', auto:true},
  {id:'revolut_deposito', n:'Revolut · Cuenta remunerada', auto:true},
  {id:'revolut_tarjeta', n:'Revolut · Tarjeta de crédito', auto:true, deuda:true},
  {id:'tr', n:'Trade Republic · Efectivo', auto:true},
  {id:'bbva', n:'BBVA', manual:true},
  {id:'efectivo', n:'Efectivo', manual:true}
];
function cuentaN(id){ var c=CUENTAS.filter(function(c){return c.id===id;})[0]; return c?c.n:id; }
function catsDefecto(){ return [
  {id:'alquiler', n:'Alquiler y casa', t:'g'}, {id:'super', n:'Supermercado', t:'g'},
  {id:'restaurantes', n:'Restaurantes y bares', t:'g'}, {id:'delivery', n:'Delivery', t:'g', fuga:1},
  {id:'transporte', n:'Transporte público', t:'g'}, {id:'uber', n:'Uber, Cabify y taxi', t:'g', fuga:1},
  {id:'estanco', n:'Estanco y vapeo', t:'g', fuga:1}, {id:'apuestas', n:'Apuestas y lotería', t:'g', fuga:1},
  {id:'videojuegos', n:'Videojuegos', t:'g', fuga:1}, {id:'suscripciones', n:'Suscripciones y gimnasio', t:'g'},
  {id:'master', n:'Máster y formación', t:'g'}, {id:'salud', n:'Salud y farmacia', t:'g'},
  {id:'compras', n:'Ropa y compras', t:'g'}, {id:'ocio', n:'Ocio y cultura', t:'g'},
  {id:'viajes', n:'Viajes', t:'g'}, {id:'deporte', n:'Deporte y carreras', t:'g'},
  {id:'plazos', n:'Compras a plazos y préstamos', t:'g'}, {id:'familia', n:'Familia', t:'g'},
  {id:'personas', n:'Bizum y transferencias a personas', t:'g'}, {id:'comisiones', n:'Comisiones e intereses pagados', t:'g'},
  {id:'cajero', n:'Retiradas de efectivo', t:'g'}, {id:'otros', n:'Otros gastos', t:'g'},
  {id:'nomina', n:'Nómina', t:'i'}, {id:'intereses', n:'Intereses cobrados', t:'i'}, {id:'otros_ing', n:'Otros ingresos', t:'i'},
  {id:'traspaso', n:'Traspaso entre mis cuentas', t:'t'}, {id:'inversion', n:'Inversión (compra/venta)', t:'t'}, {id:'pago_tarjeta', n:'Pago de tarjeta de crédito', t:'t'}
];}
function estadoInicial(){
  var base = {
    v:1, diaInicio:1, txs:[], files:[], rules:{}, cats:catsDefecto(), nextId:100, creado:hoy(), lastBackup:null,
    income:0, budget:{}, subs:[], debts:[],
    manual:{ bbva:{base:0,fecha:hoy()}, efectivo:{base:0,fecha:hoy()} },
    trSnaps:[], card:null, plantilla:[]
  };
  // Valores iniciales personales: solo existen en la versión de escritorio (src/perfil.js no se publica).
  if(typeof PERFIL_INICIAL==='function'){ var p=PERFIL_INICIAL(); for(var k in p) base[k]=p[k]; }
  return base;
}
var ES_WEB = /^https?:/.test(location.protocol);
var ES_IOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1);
var S = null;           // estado
var UI = {vista:'resumen', mes:null, fCuenta:'', fCat:'', fTxt:'', lim:150, impRes:[]};

/* ---------- categorizacion ---------- */
function norm(d){ return String(d||'').toLowerCase().replace(/[0-9*#]+/g,' ').replace(/\s+/g,' ').trim(); }
var REGLAS = [
  [/^(para guardar|retiro de apartado|to eur|desde eur|a eur|from |to cuenta|to master|to backup|a la cuenta de inversiones|to (?!eur\b)|un dep[oó]sito de apple pay)/i,'traspaso'],
  [/^trade republic$/i,'traspaso'],
  [/pago de tarjeta de cr[eé]dito|fondos excedentes/i,'pago_tarjeta'],
  [/inter[eé]s neto pagado/i,'intereses'],
  [/cargo por intereses|comisi[oó]n/i,'comisiones'],
  [/klarna/i,'plazos'],
  [/uber\s*\*?\s*eats|glovo|just ?eat|domino|deliveroo|telepizza/i,'delivery'],
  [/^uber|cabify|^bolt|free ?now|taxi/i,'uber'],
  [/estanco|tabacos|tabacs|vapeo|svap|inhala|expendedur/i,'estanco'],
  [/^bet\d*|loter[ií]a|casino|apuesta|codere|sportium|bwin|winamax|pokerstars/i,'apuestas'],
  [/instant gaming|playstation|nintendo|eneba|gportal|steam|xbox|epic games|^cex /i,'videojuegos'],
  [/^apple|patreon|dazn|netflix|adobe|google one|spotify|basic-fit|transermobile|runna/i,'suscripciones'],
  [/mercadona|carrefour|consum|lidl|aldi|^dia$|alimentaci[oó]n|supermercado|pingo doce|continente|intermarch|spar |caprabo|bonpreu|ametller|express market|maxi express|minimercado|mercader/i,'super'],
  [/emt valencia|metro de|transports metropolitans|ferrocarrils|renfe|alsa|ouigo|valenbisi/i,'transporte'],
  [/universitat polit/i,'master'],
  [/farmacia|cl[ií]nica|dental|sanitas|adeslas/i,'salud'],
  [/zara|hollister|abercrombie|nike|adidas|primark|decathlon|birkenstock|calzedonia|muji|amazon|aliexpress|media ?markt|fnac|el corte|vinted|wallapop|footdistrict|hiperasia|bazar|^normal$|tedi|lego|fashion home|barca store|kiwoko|multiprecio/i,'compras'],
  [/cine|yelmo|bowling|quickets|groupon|tennis|beachbol|beach club/i,'ocio'],
  [/rumbo|airbnb|hostel|hoteles|grandi navi|stena|ryanair|vueling|booking|citylockers|repsol|estacion de servicio|^areas$/i,'viajes'],
  [/carreras|maratona|marat[oó]n|deportiva/i,'deporte'],
  [/mcdonald|burger|kfc|taco bell|popeyes|kebab|pizzer|restaurante|asador|barecito|teika|coffee|starbucks|montaditos|honest greens|bodeg|tasca|vermut|gelat|churrer|shawer|cheesecake|bakery|trinquet|serpis|foc i brasa|sobremesa|empanadas|alfresc|santamadre|divorare|mahou|rinc[oó]n/i,'restaurantes'],
  [/atm|cajero/i,'cajero']
];
function autoCat(tx){
  var k = norm(tx.d);
  if(S.rules[k]) return S.rules[k];
  if(tx.c==='tr'){
    if(/^(buy|sell) trade|savings plan/i.test(tx.d)) return 'inversion';
    if(/inter[eé]s/i.test(tx.d+' '+tx.det)) return 'intereses';
    return 'traspaso';
  }
  if(tx.c==='revolut_deposito') return /inter[eé]s/i.test(tx.d) ? 'intereses' : 'traspaso';
  if((tx.c==='revolut_tarjeta' || tx.c==='revolut') && /^to eur/i.test(tx.d)) return 'pago_tarjeta';
  for(var i=0;i<REGLAS.length;i++) if(REGLAS[i][0].test(tx.d)) return REGLAS[i][1];
  if(/^transferencia (a|de) /i.test(tx.d)) return tx.c==='revolut_apartados' ? 'alquiler' : 'personas';
  return tx.imp>0 ? 'otros_ing' : 'otros';
}
function cat(id){ for(var i=0;i<S.cats.length;i++) if(S.cats[i].id===id) return S.cats[i]; return {id:id,n:id,t:'g'}; }
function catOpts(sel){
  var g={g:'Gastos',i:'Ingresos',t:'Traspasos (no cuentan como gasto)'}, h='';
  ['g','i','t'].forEach(function(t){ h+='<optgroup label="'+g[t]+'">'+S.cats.filter(function(c){return c.t===t;}).map(function(c){return '<option value="'+c.id+'"'+(c.id===sel?' selected':'')+'>'+esc(c.n)+'</option>';}).join('')+'</optgroup>'; });
  return h;
}

/* ---------- calculos ---------- */
function txMes(ym){ return S.txs.filter(function(t){return mesDe(t.f)===ym;}); }
function gastoPorCat(ym){ var m={}; txMes(ym).forEach(function(t){ if(cat(t.cat).t==='g') m[t.cat]=r2((m[t.cat]||0)-t.imp); }); return m; }
function totalGasto(ym){ var g=gastoPorCat(ym), s=0; for(var k in g) s+=g[k]; return r2(s); }
function totalIngreso(ym){ var s=0; txMes(ym).forEach(function(t){ if(cat(t.cat).t==='i') s+=t.imp; }); return r2(s); }
function presupuestoTotal(){ var s=0; for(var k in S.budget) s+=(+S.budget[k]||0); return r2(s); }
function meses(){ var m={}; S.txs.forEach(function(t){m[mesDe(t.f)]=1;}); m[mesDe(hoy())]=1; return Object.keys(m).sort(); }
function ordenados(cuenta){ return S.txs.filter(function(t){return t.c===cuenta;}).sort(function(a,b){return a.ord<b.ord?-1:a.ord>b.ord?1:0;}); }
function saldoCuenta(id, hasta){ // saldo de una cuenta (opcionalmente a una fecha)
  var c = CUENTAS.filter(function(c){return c.id===id;})[0];
  if(c && c.manual){
    var b=S.manual[id]; if(hasta && hasta<b.fecha) return null;
    var s=b.base; S.txs.forEach(function(t){ if(t.c===id && t.f>b.fecha && (!hasta||t.f<=hasta)) s+=t.imp; }); return r2(s);
  }
  var a = ordenados(id), ult=null;
  for(var i=0;i<a.length;i++){ if(a[i].sal==null) continue; if(hasta && a[i].f>hasta) continue; ult=a[i]; }
  return ult ? ult.sal : null;
}
function valorCartera(hasta){
  var sn = S.trSnaps.filter(function(s){return !hasta || s.f<=hasta;}).sort(function(a,b){return a.f<b.f?-1:1;});
  if(sn.length) return {v:sn[sn.length-1].v, f:sn[sn.length-1].f, est:false};
  var inv=0, hay=false; S.txs.forEach(function(t){ if(t.c==='tr' && t.cat==='inversion' && (!hasta||t.f<=hasta)){ inv-=t.imp; hay=true; } });
  return hay ? {v:Math.max(0,r2(inv)), f:null, est:true} : null;
}
function deudaTarjeta(){
  var a = ordenados('revolut_tarjeta'); if(!a.length) return null;
  var u = a[a.length-1], d = -u.sal, fmax = a.reduce(function(m,t){return t.f>m?t.f:m;}, '');
  var pagos=0, disp=0; S.txs.forEach(function(t){ if(t.c==='revolut' && t.cat==='pago_tarjeta' && t.f>fmax){ if(t.imp<0) pagos-=t.imp; else disp+=t.imp; } });
  return {deuda:Math.max(0,r2(d+disp-pagos)), extracto:r2(d), pagos:r2(pagos), disp:r2(disp), fecha:fmax};
}
function deudaTotal(){ var s=0; S.debts.forEach(function(d){s+=(+d.pend||0);}); var t=deudaTarjeta(); if(t) s+=t.deuda; return r2(s); }
function patrimonio(){
  var filas=[], act=0;
  CUENTAS.forEach(function(c){ if(c.deuda) return; var s=saldoCuenta(c.id); if(s==null && !c.manual) return; s=s||0; filas.push({id:c.id,n:c.n,v:s,manual:c.manual}); act+=s; });
  var vc=valorCartera(); if(vc){ filas.push({id:'tr_cartera', n:'Trade Republic · Cartera (ETF)', v:vc.v, est:vc.est, f:vc.f}); act+=vc.v; }
  return {filas:filas, activos:r2(act), deudas:deudaTotal(), neto:r2(act-deudaTotal())};
}
function alertas(ym){
  var out=[], g=gastoPorCat(ym), tx=txMes(ym);
  S.cats.filter(function(c){return c.fuga;}).forEach(function(c){
    var v=g[c.id]||0, lim=+S.budget[c.id]||0;
    if(v>lim+0.005) out.push({k:'bad', t:'<b>'+esc(c.n)+':</b> '+eur(v)+' gastados con un límite de '+eur(lim)+'. Te has pasado '+eur(v-lim)+'.'});
  });
  var ret=tx.filter(function(t){return t.c==='revolut' && t.imp>0 && /^(retiro de apartado|desde eur|from (backup|master|cuenta remunerada))/i.test(t.d);});
  if(ret.length){ var s=ret.reduce(function(a,t){return a+t.imp;},0); out.push({k:'warn', t:'<b>Has sacado dinero de tus apartados '+ret.length+(ret.length===1?' vez':' veces')+':</b> '+eur(s)+' en total. Si era dinero reservado para algo, lo estás usando para el día a día.'}); }
  var ven=tx.filter(function(t){return t.c==='tr' && /^sell trade/i.test(t.d);});
  if(ven.length){ var sv=ven.reduce(function(a,t){return a+t.imp;},0); out.push({k:'bad', t:'<b>Has vendido ETF '+ven.length+(ven.length===1?' vez':' veces')+':</b> '+eur(sv)+'. Invertir para vender a las semanas no es invertir.'}); }
  var disp=tx.filter(function(t){return t.c==='revolut' && t.imp>0 && /^to eur/i.test(t.d);});
  if(disp.length){ var sd=disp.reduce(function(a,t){return a+t.imp;},0); out.push({k:'bad', t:'<b>Has pasado '+eur(sd)+' de la tarjeta de crédito a tu cuenta en '+disp.length+(disp.length===1?' vez':' veces')+'.</b> Es deuda con comisión del 4 % para cubrir gasto corriente.'}); }
  var cc=tx.filter(function(t){return t.c==='revolut_tarjeta' && t.imp<0 && cat(t.cat).t==='g';});
  if(cc.length){ var sc=cc.reduce(function(a,t){return a-t.imp;},0); out.push({k:'warn', t:'<b>'+eur(sc)+' comprados a crédito</b> este mes en '+cc.length+' movimientos.'}); }
  var tot=totalGasto(ym), pre=presupuestoTotal();
  if(pre>0 && tot>pre) out.push({k:'bad', t:'<b>Presupuesto superado:</b> llevas '+eur(tot)+' de '+eur(pre)+'.'});
  if(tx.length && !totalIngreso(ym)) out.push({k:'warn', t:'<b>No hay ingresos registrados en este periodo.</b> Si cobras en una cuenta que no importas (BBVA), añade la nómina desde Ajustes › BBVA o en Movimientos.'});
  return out;
}

/* ---------- importacion ---------- */
function clave(t){ return [t.c,t.f,t.d,t.imp,t.sal].join('|'); }
function fusionar(res, nombre){
  var fid = 'f'+(S.nextId++), nuevos=0, dup=0;
  var existentes={}; S.txs.forEach(function(t){ var k=clave(t); existentes[k]=(existentes[k]||0)+1; });
  var vistos={};
  var hasta = (res.periodo&&res.periodo.hasta) || res.extra.generado || hoy();
  var base = hasta+'|'+('000000'+S.nextId).slice(-6)+'|';
  res.txs.forEach(function(x){
    var t={id:S.nextId++, f:x.fecha, c:x.cuenta, d:x.desc, det:x.detalle||'', imp:x.importe, sal:x.saldo, src:fid, ord:base+('000000'+x.seq).slice(-6)};
    var k=clave(t); vistos[k]=(vistos[k]||0)+1;
    if(vistos[k] <= (existentes[k]||0)){ dup++; return; }
    t.cat=autoCat(t); S.txs.push(t); nuevos++;
  });
  if(res.tipo==='tr-patrimonio' && res.extra.fecha && res.extra.valores!=null){
    S.trSnaps = S.trSnaps.filter(function(s){return s.f!==res.extra.fecha;});
    S.trSnaps.push({f:res.extra.fecha, v:res.extra.valores, src:fid}); nuevos++;
  }
  if(res.tipo==='revolut-tarjeta'){
    if(!S.card || !S.card.generado || (res.extra.generado||'')>=S.card.generado) S.card = {generado:res.extra.generado, limite:res.extra.limite, saldoExtracto:res.extra.saldoExtracto, pagoMinimo:res.extra.pagoMinimo, vence:res.extra.vence, plazos:res.extra.plazos||[], src:fid};
  }
  var NOM={'revolut-cuenta':'Revolut · Estado de cuenta','revolut-tarjeta':'Revolut · Tarjeta de crédito','tr-cuenta':'Trade Republic · Extracto de cuenta','tr-patrimonio':'Trade Republic · Patrimonio'};
  var f={id:fid, nombre:nombre, tipo:NOM[res.tipo]||res.tipo, desde:res.periodo&&res.periodo.desde||res.extra.fecha||'', hasta:res.periodo&&res.periodo.hasta||res.extra.fecha||'', nuevos:nuevos, dup:dup, cuando:hoy()};
  S.files.push(f);
  return f;
}
async function leerPDF(buf){
  var doc = await pdfjsLib.getDocument({data:new Uint8Array(buf), isEvalSupported:false, useSystemFonts:true, disableFontFace:true, verbosity:0}).promise;
  var pages=[];
  for(var p=1;p<=doc.numPages;p++){
    var page = await doc.getPage(p), vp = page.getViewport({scale:1}), tc = await page.getTextContent();
    pages.push(itemsToLines(tc.items.filter(function(i){return i.str && i.str.trim();}).map(function(i){return {str:i.str, x:i.transform[4], y:vp.height-i.transform[5]};})));
  }
  return pages;
}
async function importar(files){
  UI.impRes=[]; UI.importando=true; render();
  for(var i=0;i<files.length;i++){
    var f=files[i], r={nombre:f.name, ok:false, avisos:[]};
    try{
      if(!/\.pdf$/i.test(f.name) && f.type!=='application/pdf') throw new Error('No es un PDF.');
      var res = parseExtracto(await leerPDF(await f.arrayBuffer()));
      r.avisos = res.avisos||[];
      if(res.tipo && res.tipo!=='revolut-personalizado'){ var fr=fusionar(res, f.name); r.ok=true; r.f=fr; }
    }catch(e){ r.avisos=['No se pudo leer: '+(e&&e.message||e)]; }
    UI.impRes.push(r);
  }
  UI.importando=false;
  await guardar(); render();
}
function borrarFichero(fid){
  S.txs = S.txs.filter(function(t){return t.src!==fid;});
  S.trSnaps = S.trSnaps.filter(function(s){return s.src!==fid;});
  if(S.card && S.card.src===fid) S.card=null;
  S.files = S.files.filter(function(f){return f.id!==fid;});
}

/* ---------- aprendizaje de categorias ---------- */
function cambiarCat(id, nueva){
  var t = S.txs.filter(function(t){return t.id===id;})[0]; if(!t) return;
  t.cat=nueva; t.man=1;
  var k=norm(t.d), n=0;
  if(k){ S.rules[k]=nueva; S.txs.forEach(function(o){ if(o!==t && !o.man && norm(o.d)===k && o.cat!==nueva){ o.cat=nueva; n++; } }); }
  toast('Aprendido: «'+t.d.slice(0,40)+'» es '+cat(nueva).n+(n?'. Aplicado a '+n+' movimientos más.':'.'));
}

/* ================= almacenamiento cifrado ================= */
var KEY=null, SALT=null, DBN='misfinanzas';
function idb(){ return new Promise(function(ok,ko){ var r=indexedDB.open(DBN,1); r.onupgradeneeded=function(){r.result.createObjectStore('kv');}; r.onsuccess=function(){ok(r.result);}; r.onerror=function(){ko(r.error);}; }); }
async function idbGet(k){ var db=await idb(); return new Promise(function(ok,ko){ var r=db.transaction('kv').objectStore('kv').get(k); r.onsuccess=function(){ok(r.result);}; r.onerror=function(){ko(r.error);}; }); }
async function idbSet(k,v){ var db=await idb(); return new Promise(function(ok,ko){ var tx=db.transaction('kv','readwrite'); tx.objectStore('kv').put(v,k); tx.oncomplete=function(){ok();}; tx.onerror=function(){ko(tx.error);}; }); }
async function derivar(pass, salt){
  var km = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2', salt:salt, iterations:310000, hash:'SHA-256'}, km, {name:'AES-GCM', length:256}, false, ['encrypt','decrypt']);
}
async function cifrar(obj){ var iv=crypto.getRandomValues(new Uint8Array(12)); var ct=await crypto.subtle.encrypt({name:'AES-GCM',iv:iv}, KEY, new TextEncoder().encode(JSON.stringify(obj))); return {salt:SALT, iv:iv, ct:new Uint8Array(ct)}; }
async function descifrar(blob, key){ var pt=await crypto.subtle.decrypt({name:'AES-GCM',iv:blob.iv}, key, blob.ct); return JSON.parse(new TextDecoder().decode(pt)); }
var guardando=Promise.resolve();
function guardar(){ guardando = guardando.then(async function(){ await idbSet('data', await cifrar(S)); }).catch(function(e){ toast('Error al guardar: '+e.message); }); return guardando; }
function b64(u8){ var s=''; for(var i=0;i<u8.length;i+=0x8000) s+=String.fromCharCode.apply(null,u8.subarray(i,i+0x8000)); return btoa(s); }
function unb64(s){ var b=atob(s), u=new Uint8Array(b.length); for(var i=0;i<b.length;i++) u[i]=b.charCodeAt(i); return u; }

async function arrancar(){
  var lock=$('#lock');
  if(!window.crypto || !crypto.subtle || !window.indexedDB){ lock.innerHTML='<div class="card"><h1>No se puede abrir</h1><p>Este navegador no permite cifrar los datos. Abre la app con Microsoft Edge o Google Chrome.</p></div>'; return; }
  var blob = await idbGet('data');
  if(!blob){
    lock.innerHTML='<form class="card"><h1>Mis Finanzas</h1><p class="sub">Primera vez: crea tu contraseña. Tus datos se guardan cifrados solo en este ordenador.</p>'+
      '<input type="password" id="p1" placeholder="Contraseña (mínimo 6 caracteres)" autocomplete="new-password" autofocus><input type="password" id="p2" placeholder="Repite la contraseña" autocomplete="new-password">'+
      '<button class="btn pri">Crear y entrar</button><div class="err"></div><p class="small muted" style="margin:6px 0 0">Si olvidas la contraseña no hay forma de recuperar los datos. Apúntala.</p></form>';
    $('#lock form').onsubmit=async function(e){ e.preventDefault(); var a=$('#p1').value, b=$('#p2').value;
      if(a.length<6){ $('#lock .err').textContent='Mínimo 6 caracteres.'; return; }
      if(a!==b){ $('#lock .err').textContent='Las contraseñas no coinciden.'; return; }
      SALT=crypto.getRandomValues(new Uint8Array(16)); KEY=await derivar(a,SALT); S=estadoInicial(); await guardar(); entrar(); };
  } else {
    lock.innerHTML='<form class="card"><h1>Mis Finanzas</h1><p class="sub">Introduce tu contraseña.</p><input type="password" id="p1" placeholder="Contraseña" autocomplete="current-password" autofocus><button class="btn pri">Entrar</button><div class="err"></div></form>';
    $('#lock form').onsubmit=async function(e){ e.preventDefault(); $('#lock .err').textContent='Comprobando…';
      try{ var k=await derivar($('#p1').value, blob.salt); S=await descifrar(blob,k); KEY=k; SALT=blob.salt; migrar(); entrar(); }
      catch(err){ $('#lock .err').textContent='Contraseña incorrecta.'; $('#p1').select(); } };
  }
}
function migrar(){ var d=estadoInicial(); for(var k in d) if(S[k]===undefined) S[k]=d[k]; }
function entrar(){ try{ if(navigator.storage && navigator.storage.persist) navigator.storage.persist(); }catch(e){} $('#lock').style.display='none'; $('#app').style.display=''; UI.mes = mesInicial(); render(); }
function mesInicial(){ var m=meses(), h=mesDe(hoy()); if(txMes(h).length) return h; var con=m.filter(function(x){return txMes(x).length;}); return con.length?con[con.length-1]:h; }

/* ================= interfaz ================= */
var VISTAS=[['resumen','Resumen'],['movimientos','Movimientos'],['presupuesto','Presupuesto'],['deudas','Deudas'],['patrimonio','Patrimonio'],['suscripciones','Suscripciones'],['importar','Importar PDFs'],['ajustes','Ajustes']];
function render(){
  var al = S.txs.length ? alertas(UI.mes).filter(function(a){return a.k==='bad';}).length : 0;
  $('nav').innerHTML='<div class="brand"><i></i>Mis Finanzas</div>'+VISTAS.map(function(v){ return '<button data-v="'+v[0]+'" class="'+(UI.vista===v[0]?'on':'')+'">'+v[1]+(v[0]==='resumen'&&al?'<span class="badge">'+al+'</span>':'')+'</button>'; }).join('')+
    '<div class="spacer"></div><button data-act="bloquear">Bloquear</button>';
  var m=$('main'); m.innerHTML = VISTA[UI.vista]();
  if(POST[UI.vista]) POST[UI.vista](m);
}
function selMes(){
  var ms=meses(); if(ms.indexOf(UI.mes)<0) ms.push(UI.mes); ms.sort();
  return '<div class="row"><button class="btn" data-act="mes" data-d="-1" aria-label="Mes anterior">‹</button><select data-ch="mes">'+ms.map(function(x){return '<option value="'+x+'"'+(x===UI.mes?' selected':'')+'>'+mesEtq(x)+'</option>';}).join('')+'</select><button class="btn" data-act="mes" data-d="1" aria-label="Mes siguiente">›</button></div>';
}
function cab(t, sub, extra){ return '<div class="row between" style="margin-bottom:14px;align-items:flex-start"><div><h1>'+t+'</h1><div class="sub" style="margin:0">'+sub+'</div></div>'+(extra||'')+'</div>'; }
function vacio(){ return '<div class="card empty"><p><b>Todavía no hay datos.</b></p><p>Empieza importando tus extractos en PDF de Revolut y Trade Republic.</p><button class="btn pri" data-v="importar">Importar PDFs</button></div>'; }
function barra(v, lim){ var p = lim>0 ? Math.min(100, v/lim*100) : (v>0?100:0); var cl = v>lim+0.005 ? 'over' : (lim>0 && v/lim>0.85 ? 'near':''); return '<div class="bar '+cl+'"><i style="width:'+p.toFixed(1)+'%"></i></div>'; }

var VISTA={}, POST={};
VISTA.resumen=function(){
  if(!S.txs.length) return cab('Resumen','Tu situación de un vistazo.')+vacio();
  var ym=UI.mes, g=gastoPorCat(ym), tot=totalGasto(ym), ing=totalIngreso(ym), pre=presupuestoTotal(), pat=patrimonio(), al=alertas(ym);
  var esActual = ym===mesDe(hoy()), quedan=Math.round((new Date(rango(ym).fin)-new Date(hoy()))/864e5)+1, rest=r2(pre-tot);
  var h = cab('Resumen','Así va '+mesEtq(ym)+'.', selMes());
  h+='<div class="grid g4" style="margin-bottom:16px">'+
    kpi('Gastado en el mes', eur(tot), 'de '+eur(pre)+' presupuestados')+
    kpi(rest>=0?'Te queda por gastar':'Te has pasado', '<span style="color:var(--'+(rest>=0?'text':'bad')+')">'+eur(Math.abs(rest))+'</span>', esActual&&rest>0&&quedan>1 ? eur(rest/quedan)+' al día durante '+quedan+' días' : (ing?'Ingresos registrados: '+eur(ing):'Sin ingresos registrados este mes'))+
    kpi('Patrimonio neto', eur(pat.neto), 'Activos '+eur(pat.activos)+' · Deudas '+eur(pat.deudas))+
    kpi('Deuda total', eur(pat.deudas), (function(){ var n=S.debts.filter(function(d){return +d.pend>0;}).length+((deudaTarjeta()||{}).deuda>0?1:0); return n+(n===1?' deuda abierta':' deudas abiertas'); })())+'</div>';
  h+='<div class="card"><h2>Alertas del mes</h2>'+(al.length? al.map(function(a){return '<div class="alert '+a.k+'"><span class="ic">'+(a.k==='bad'?'!':'▲')+'</span><div>'+a.t+'</div></div>';}).join('') : '<div class="alert good"><span class="ic">✓</span><div>Sin fugas ni excesos este mes.</div></div>')+'</div>';
  var cs = Object.keys(g).filter(function(k){return g[k]>0.005;}).sort(function(a,b){return g[b]-g[a];}), mx = cs.length? g[cs[0]] : 1;
  h+='<div class="grid g2"><div class="card"><h2>Gasto por categoría</h2>'+(cs.length? '<div class="legend"><span><i style="background:var(--s1)"></i>Gasto normal</span><span><i style="background:var(--s2)"></i>Fuga vigilada</span></div>'+cs.map(function(k){ var c=cat(k), lim=+S.budget[k]||0;
      return '<div class="hb" data-tip="'+esc(c.n)+': '+eur(g[k])+(lim?' de '+eur(lim)+' presupuestados':' (sin presupuesto)')+'" data-go-cat="'+k+'" style="cursor:pointer"><div class="n">'+esc(c.n)+'</div><div class="t"><i class="'+(c.fuga?'fuga':'')+'" style="width:'+(g[k]/mx*100).toFixed(1)+'%"></i></div><div class="num" style="text-align:right">'+eur(g[k])+'</div></div>'; }).join('') : '<div class="empty">Sin gastos este mes.</div>')+'</div>';
  h+='<div class="card"><h2>Ingresos y gastos por mes</h2>'+chartMeses()+'</div></div>';
  h+='<div class="card"><h2>Dinero en cuentas e inversión al cierre de cada mes</h2>'+chartPatrimonio()+'</div>';
  return h;
};
function kpi(l,v,d){ return '<div class="card kpi"><div class="l">'+l+'</div><div class="v num">'+v+'</div><div class="d">'+d+'</div></div>'; }
function escala(max){ if(max<=0) return 100; var p=Math.pow(10,Math.floor(Math.log10(max))), n=max/p; return (n<=1?1:n<=2?2:n<=5?5:10)*p; }
function chartMeses(){
  var ms=meses().filter(function(m){return txMes(m).length;}).slice(-12); if(!ms.length) return '<div class="empty">Sin datos.</div>';
  var d=ms.map(function(m){return {m:m, i:totalIngreso(m), g:totalGasto(m)};}), mx=escala(Math.max.apply(null,d.map(function(x){return Math.max(x.i,x.g);})));
  var W=520,H=210,L=44,B=22,T=8, pw=(W-L)/d.length, bw=Math.min(16,(pw-8)/2), y=function(v){return T+(H-T-B)*(1-v/mx);};
  var s='<div class="legend"><span><i style="background:var(--s1)"></i>Ingresos</span><span><i style="background:var(--s2)"></i>Gastos</span></div><svg viewBox="0 0 '+W+' '+H+'" width="100%" role="img" aria-label="Ingresos y gastos por mes">';
  [0,.5,1].forEach(function(f){ s+='<line class="grid" x1="'+L+'" x2="'+W+'" y1="'+y(mx*f)+'" y2="'+y(mx*f)+'"/><text x="'+(L-6)+'" y="'+(y(mx*f)+4)+'" text-anchor="end">'+eur0(mx*f)+'</text>'; });
  d.forEach(function(x,k){ var cx=L+pw*k+pw/2;
    s+=rbar(cx-bw-1,y(x.i),bw,y(0)-y(x.i),'var(--s1)')+rbar(cx+1,y(x.g),bw,y(0)-y(x.g),'var(--s2)');
    s+='<text x="'+cx+'" y="'+(H-6)+'" text-anchor="middle">'+mesCorto(x.m)+'</text>';
    s+='<rect class="hit" x="'+(L+pw*k)+'" y="'+T+'" width="'+pw+'" height="'+(H-T-B)+'" data-tip="'+mesLargo(x.m)+'\nIngresos: '+eur(x.i)+'\nGastos: '+eur(x.g)+'" data-set-mes="'+x.m+'" style="cursor:pointer"/>'; });
  return s+'</svg>';
}
function rbar(x,y,w,h,fill){ if(h<0.5) return ''; var r=Math.min(4,h,w/2); return '<path fill="'+fill+'" d="M'+x+','+(y+h)+'V'+(y+r)+'a'+r+','+r+' 0 0 1 '+r+','+(-r)+'h'+(w-2*r)+'a'+r+','+r+' 0 0 1 '+r+','+r+'V'+(y+h)+'z"/>'; }
function activosA(f){ var s=0, hay=false; CUENTAS.forEach(function(c){ if(c.deuda) return; var v=saldoCuenta(c.id,f); if(v!=null){ s+=v; hay=true; } }); var vc=valorCartera(f); if(vc){ s+=vc.v; hay=true; } return hay?r2(s):null; }
function chartPatrimonio(){
  var ms=meses().slice(-18), d=[]; ms.forEach(function(m){ var f=rango(m).fin; if(f>hoy()) f=hoy(); var v=activosA(f); if(v!=null) d.push({m:m,v:v}); });
  if(d.length<2) return '<div class="empty">Hace falta más de un mes de datos para dibujar la evolución.</div>';
  var mn=Math.min(0,Math.min.apply(null,d.map(function(x){return x.v;}))), mx=escala(Math.max.apply(null,d.map(function(x){return x.v;}))); if(mn<0) mn=-escala(-mn);
  var movil=window.innerWidth<720, W=movil?420:1080,H=movil?220:200,L=50,B=22,T=10, pw=(W-L-10)/(d.length-1), y=function(v){return T+(H-T-B)*(1-(v-mn)/(mx-mn));}, x=function(k){return L+pw*k;};
  var s='<svg viewBox="0 0 '+W+' '+H+'" width="100%" role="img" aria-label="Evolución del dinero en cuentas e inversión">';
  (mn<0?[mn,0,mx]:[0,mx/2,mx]).forEach(function(v){ s+='<line class="grid" x1="'+L+'" x2="'+W+'" y1="'+y(v)+'" y2="'+y(v)+'"/><text x="'+(L-6)+'" y="'+(y(v)+4)+'" text-anchor="end">'+eur0(v)+'</text>'; });
  s+='<polyline fill="none" stroke="var(--s1)" stroke-width="2" stroke-linejoin="round" points="'+d.map(function(p,k){return x(k)+','+y(p.v);}).join(' ')+'"/>';
  d.forEach(function(p,k){ var etq = !movil || d.length<7 || (d.length-1-k)%2===0;
    s+='<circle cx="'+x(k)+'" cy="'+y(p.v)+'" r="4" fill="var(--s1)" stroke="var(--surface)" stroke-width="2"/>'+
    (etq ? '<text x="'+x(k)+'" y="'+(H-6)+'" text-anchor="'+(k===0?'start':k===d.length-1?'end':'middle')+'">'+mesCorto(p.m)+'</text>' : '')+
    '<rect class="hit" x="'+(x(k)-pw/2)+'" y="'+T+'" width="'+pw+'" height="'+(H-T-B)+'" data-tip="'+mesLargo(p.m)+': '+eur(p.v)+'"/>'; });
  var u=d[d.length-1]; s+='<text x="'+(x(d.length-1)-8)+'" y="'+(y(u.v)-10)+'" text-anchor="end" style="fill:var(--text);font-weight:600;font-size:12px">'+eur0(u.v)+'</text>';
  return s+'</svg><p class="small muted" style="margin:6px 0 0">Suma los saldos de tus cuentas y la cartera. Sin extracto de patrimonio de Trade Republic, la cartera se estima por lo aportado menos lo vendido.</p>';
}

VISTA.movimientos=function(){
  var q=UI.fTxt.toLowerCase();
  var a=S.txs.filter(function(t){ return (UI.fMes==='todos'|| mesDe(t.f)===UI.mes) && (!UI.fCuenta||t.c===UI.fCuenta) && (!UI.fCat||t.cat===UI.fCat) && (!q || (t.d+' '+t.det).toLowerCase().indexOf(q)>=0); })
    .sort(function(x,y){ return x.f<y.f?1:x.f>y.f?-1:(x.ord<y.ord?1:-1); });
  var sum=a.reduce(function(s,t){return s+t.imp;},0);
  var h=cab('Movimientos','Cambia la categoría de un movimiento y la app lo aprende para todos los del mismo comercio.','<button class="btn pri" data-act="nuevoMov">Añadir movimiento</button>');
  h+='<div class="card"><div class="row" style="margin-bottom:12px">'+selMes()+'<label class="row small"><input type="checkbox" data-ch="todosMeses"'+(UI.fMes==='todos'?' checked':'')+'> Todos los meses</label>'+
    '<select data-ch="fCuenta"><option value="">Todas las cuentas</option>'+CUENTAS.map(function(c){return '<option value="'+c.id+'"'+(UI.fCuenta===c.id?' selected':'')+'>'+esc(c.n)+'</option>';}).join('')+'</select>'+
    '<select data-ch="fCat"><option value="">Todas las categorías</option>'+catOpts(UI.fCat)+'</select>'+
    '<input type="text" placeholder="Buscar…" data-in="fTxt" value="'+esc(UI.fTxt)+'" style="flex:1;min-width:130px"></div>';
  h+='<div class="small muted" style="margin-bottom:6px">'+a.length+' movimientos · suma '+eur(sum)+'</div>';
  if(!a.length) h+='<div class="empty">No hay movimientos con estos filtros.</div>';
  else { h+='<div class="tablewrap"><table class="mov"><thead><tr><th>Fecha</th><th>Descripción</th><th class="hm">Cuenta</th><th>Categoría</th><th class="r">Importe</th><th></th></tr></thead><tbody>'+
    a.slice(0,UI.lim).map(function(t){ return '<tr><td class="num">'+fechaCorta(t.f)+'</td><td><div>'+esc(t.d)+'</div>'+(t.det?'<div class="det" title="'+esc(t.det)+'">'+esc(t.det)+'</div>':'')+'</td><td class="hm"><span class="pill">'+esc(cuentaN(t.c))+'</span></td>'+
      '<td><select data-cat="'+t.id+'" aria-label="Categoría">'+catOpts(t.cat)+'</select></td><td class="r num '+(t.imp>0?'pos':'neg')+'">'+(t.imp>0?'+':'')+eur(t.imp)+'</td>'+
      '<td class="r">'+(t.src==='manual'?'<button class="btn sm" data-act="editMov" data-id="'+t.id+'">Editar</button>':'')+'</td></tr>'; }).join('')+'</tbody></table></div>';
    if(a.length>UI.lim) h+='<div style="text-align:center;margin-top:12px"><button class="btn" data-act="mas">Ver más ('+(a.length-UI.lim)+' restantes)</button></div>'; }
  return h+'</div>';
};

VISTA.presupuesto=function(){
  var ym=UI.mes, g=gastoPorCat(ym), pre=presupuestoTotal(), tot=totalGasto(ym), libre=r2(S.income-pre);
  var h=cab('Presupuesto','Límite mensual por categoría contra lo gastado en '+mesEtq(ym)+'.', selMes());
  h+='<div class="grid g4" style="margin-bottom:16px">'+
    '<div class="card kpi"><div class="l">Ingreso neto mensual</div><div class="v"><input type="number" step="0.01" data-num="income" value="'+S.income+'" style="width:100%;font-size:22px;font-weight:650;text-align:left"></div><div class="d">Tu nómina. Edítala si cambia.</div></div>'+
    kpi('Presupuesto de gasto', eur(pre), 'suma de todos los límites')+
    kpi(libre>=0?'Sobra para ahorro e inversión':'Presupuestas más de lo que ganas', '<span style="color:var(--'+(libre>=0?'good':'bad')+')">'+eur(Math.abs(libre))+'</span>', 'ingreso menos presupuesto')+
    kpi('Gastado', eur(tot), pre>0? Math.round(tot/pre*100)+' % del presupuesto':'')+'</div>';
  h+='<div class="card"><div class="tablewrap"><table><thead><tr><th>Categoría</th><th class="r" style="width:120px">Límite mensual</th><th class="r">Gastado</th><th style="width:26%">Progreso</th><th class="r">Queda</th></tr></thead><tbody>'+
    S.cats.filter(function(c){return c.t==='g';}).map(function(c){ var v=g[c.id]||0, lim=+S.budget[c.id]||0, q=r2(lim-v);
      return '<tr><td>'+esc(c.n)+(c.fuga?' <span class="pill warn">fuga vigilada</span>':'')+'</td><td class="r"><input type="number" min="0" step="5" data-bud="'+c.id+'" value="'+lim+'" style="width:100px" aria-label="Límite de '+esc(c.n)+'"></td>'+
        '<td class="r num"><a href="#" data-go-cat="'+c.id+'" style="color:inherit">'+eur(v)+'</a></td><td>'+barra(v,lim)+'</td><td class="r num" style="color:var(--'+(q<-0.005?'bad':'text-2')+')">'+(q<-0.005?'−'+eur(-q):eur(q))+'</td></tr>'; }).join('')+
    '</tbody></table></div><div class="row" style="margin-top:14px"><label class="row">Mi mes empieza el día <input type="number" min="1" max="28" data-num="diaInicio" value="'+diaIni()+'" style="width:70px"></label><span class="small muted">Ponlo justo antes de tu día de cobro para que la nómina y el gasto que financia caigan en el mismo mes. Con 1 se usan meses naturales.</span></div><p class="small muted" style="margin:12px 0 0">Escribe un límite en cada categoría. Lo que sobre del ingreso es lo que puedes destinar a ahorro e inversión.</p></div>';
  return h;
};

VISTA.deudas=function(){
  var t=deudaTarjeta(), h=cab('Deudas','Lo que debes hoy. Total: <b>'+eur(deudaTotal())+'</b>','<button class="btn pri" data-act="nuevaDeuda">Añadir deuda</button>');
  h+='<div class="card"><h2>Tarjeta de crédito Revolut</h2>';
  if(!t) h+='<p class="muted">Importa un extracto de la tarjeta de crédito para ver su saldo.</p>';
  else { h+='<div class="grid g3"><div><div class="small muted">Deuda estimada hoy</div><div class="num" style="font-size:22px;font-weight:650">'+eur(t.deuda)+'</div></div>'+
      '<div><div class="small muted">Saldo en el último extracto ('+fechaCorta(t.fecha)+')</div><div class="num">'+eur(t.extracto)+'</div></div>'+
      '<div><div class="small muted">Después: pagos desde tu cuenta / dinero sacado de la tarjeta</div><div class="num">'+eur(t.pagos)+' / '+eur(t.disp)+'</div></div></div>'+
      '<p class="small muted" style="margin:10px 0 0">Es una estimación: las compras con la tarjeta posteriores al último extracto importado no se conocen. Importa el extracto más reciente de la tarjeta para tener el dato exacto.</p>';
    if(S.card){ h+='<p class="small muted" style="margin-top:10px">Límite '+eur0(S.card.limite||0)+(S.card.pagoMinimo!=null?' · Pago mínimo del último extracto '+eur(S.card.pagoMinimo)+(S.card.vence?' (vence el '+fechaCorta(S.card.vence)+')':''):'')+'</p>';
      if(S.card.plazos&&S.card.plazos.length) h+='<h2 style="margin-top:14px">Compras fraccionadas</h2><div class="tablewrap"><table><thead><tr><th>Compra</th><th>Inicio</th><th class="r">Importe</th><th class="r">Total con intereses</th><th class="r">Cuota</th><th class="r">Pendiente</th><th>Avance</th></tr></thead><tbody>'+
        S.card.plazos.map(function(p){return '<tr><td>'+esc(p.desc)+'</td><td class="num">'+fechaCorta(p.inicio)+'</td><td class="r num">'+eur(p.compra)+'</td><td class="r num">'+eur(p.total)+'</td><td class="r num">'+eur(p.cuota)+'</td><td class="r num">'+eur(p.restante||0)+'</td><td>'+esc(p.progreso)+'</td></tr>';}).join('')+'</tbody></table></div>'; }
  }
  h+='</div><div class="card"><h2>Otras deudas</h2>';
  if(!S.debts.length) h+='<div class="empty">Sin otras deudas.</div>';
  else h+='<div class="tablewrap"><table><thead><tr><th>Deuda</th><th class="r">Pendiente</th><th class="r">Cuota mensual</th><th>Termina</th><th>Nota</th><th></th></tr></thead><tbody>'+S.debts.map(function(d){
    return '<tr><td>'+esc(d.n)+'</td><td class="r num">'+eur(+d.pend||0)+'</td><td class="r num">'+(d.cuota?eur(+d.cuota):'—')+'</td><td>'+(d.fin?mesLargo(d.fin):'—')+'</td><td class="small muted">'+esc(d.nota||'')+'</td><td class="r"><button class="btn sm" data-act="editDeuda" data-id="'+d.id+'">Editar</button></td></tr>'; }).join('')+'</tbody></table></div>';
  return h+'</div>';
};

VISTA.patrimonio=function(){
  var p=patrimonio(), h=cab('Patrimonio','Lo que tienes menos lo que debes.');
  h+='<div class="grid g3" style="margin-bottom:16px">'+kpi('Activos',eur(p.activos),'cuentas e inversión')+kpi('Deudas',eur(p.deudas),'tarjeta y otras')+kpi('Patrimonio neto','<span style="color:var(--'+(p.neto>=0?'text':'bad')+')">'+eur(p.neto)+'</span>','activos menos deudas')+'</div>';
  h+='<div class="card"><h2>Cuentas</h2><div class="tablewrap"><table><thead><tr><th>Cuenta</th><th class="hm">Origen del dato</th><th class="r">Saldo</th><th></th></tr></thead><tbody>'+p.filas.map(function(f){
    var org = f.manual ? 'Manual: saldo fijado el '+fechaCorta(S.manual[f.id].fecha)+' más tus movimientos posteriores' : f.id==='tr_cartera' ? (f.est?'Estimado (aportado menos vendido)':'Valor a '+fechaCorta(f.f)) : 'Último extracto importado';
    var btn = f.manual ? '<button class="btn sm" data-act="fijarSaldo" data-id="'+f.id+'">Fijar saldo</button>' : f.id==='tr_cartera' ? '<button class="btn sm" data-act="valorTR">Actualizar valor</button>' : '';
    return '<tr><td>'+esc(f.n)+'</td><td class="small muted hm">'+org+'</td><td class="r num">'+eur(f.v)+'</td><td class="r">'+btn+'</td></tr>'; }).join('')+
    (valorCartera()?'':'<tr><td>Trade Republic · Cartera (ETF)</td><td class="small muted hm">Sin datos</td><td class="r num">—</td><td class="r"><button class="btn sm" data-act="valorTR">Poner valor</button></td></tr>')+
    '</tbody></table></div><p class="small muted" style="margin:12px 0 0">El saldo de Apartados incluye todo lo que hay en ellos. Si parte es de otra persona (por ejemplo la mitad del alquiler compartido), añádela en Deudas para que no cuente como tuya.</p></div>';
  h+='<div class="card"><h2>Evolución</h2>'+chartPatrimonio()+'</div>';
  return h;
};

function ultimoCargo(s){
  var m=(s.match||'').toLowerCase(); if(!m) return null;
  var a=S.txs.filter(function(t){ return t.imp<0 && t.d.toLowerCase().indexOf(m)>=0 && (!s.exact || Math.abs(-t.imp-s.imp)<0.02); }).sort(function(x,y){return x.f<y.f?1:-1;});
  return a[0]||null;
}
function candidatas(){
  var excl={super:1,restaurantes:1,estanco:1,uber:1,delivery:1,transporte:1,personas:1,alquiler:1,plazos:1}, g={};
  S.txs.forEach(function(t){ if(t.imp>=0 || cat(t.cat).t!=='g' || excl[t.cat]) return; var k=norm(t.d)+'|'+(-t.imp).toFixed(2); (g[k]=g[k]||{d:t.d,imp:-t.imp,m:{},ult:''}).m[t.f.slice(0,7)]=1; if(t.f>g[k].ult) g[k].ult=t.f; });
  var lim=mesSig(hoy().slice(0,7),-3);
  return Object.keys(g).map(function(k){return g[k];}).filter(function(x){
    if(Object.keys(x.m).length<3 || x.ult.slice(0,7)<lim) return false;
    return !S.subs.some(function(s){ return x.d.toLowerCase().indexOf((s.match||'¬').toLowerCase())>=0 && (!s.exact || Math.abs(s.imp-x.imp)<0.02); });
  }).sort(function(a,b){return b.imp-a.imp;});
}
VISTA.suscripciones=function(){
  var act=S.subs.filter(function(s){return s.on;}), tot=act.reduce(function(a,s){return a+(+s.imp||0);},0);
  var h=cab('Suscripciones','Activas: <b>'+eur(tot)+' al mes</b>, '+eur(tot*12)+' al año.','<button class="btn pri" data-act="nuevaSub">Añadir suscripción</button>');
  h+='<div class="card"><div class="tablewrap"><table><thead><tr><th>Suscripción</th><th class="r">Al mes</th><th>Último cargo encontrado</th><th>Estado</th><th>Nota</th><th></th></tr></thead><tbody>'+
    S.subs.map(function(s){ var u=ultimoCargo(s), viejo = u && u.f < mesSig(hoy().slice(0,7),-1)+'-01';
      return '<tr><td>'+esc(s.n)+'</td><td class="r num">'+eur(+s.imp||0)+'</td><td>'+(u? fechaCorta(u.f)+' · '+eur(-u.imp)+(viejo&&s.on?' <span class="pill warn">sin cargo reciente</span>':'') : '<span class="muted">—</span>')+'</td>'+
        '<td>'+(s.on?'<span class="pill good">Activa</span>':'<span class="pill">Cancelada</span>')+'</td><td class="small muted">'+esc(s.nota||'')+'</td><td class="r"><button class="btn sm" data-act="editSub" data-id="'+s.id+'">Editar</button></td></tr>'; }).join('')+'</tbody></table></div></div>';
  var c=candidatas();
  if(c.length) h+='<div class="card"><h2>Cargos que se repiten y no están en tu lista</h2><div class="tablewrap"><table><thead><tr><th>Comercio</th><th class="r">Importe</th><th>Meses</th><th>Último</th><th></th></tr></thead><tbody>'+c.map(function(x,i){
    return '<tr><td>'+esc(x.d)+'</td><td class="r num">'+eur(x.imp)+'</td><td>'+Object.keys(x.m).length+'</td><td>'+fechaCorta(x.ult)+'</td><td class="r"><button class="btn sm" data-act="addCand" data-i="'+i+'">Añadir como suscripción</button></td></tr>'; }).join('')+'</tbody></table></div></div>';
  return h;
};

VISTA.importar=function(){
  var h=cab('Importar PDFs','Arrastra aquí tus extractos. La app reconoce el banco, añade lo nuevo y descarta lo que ya tenía.');
  h+='<div class="drop" id="drop" tabindex="0"><b>'+(UI.importando?'Leyendo…':'Arrastra tus PDFs aquí')+'</b><p class="muted" style="margin:6px 0 0">o haz clic para elegirlos. Puedes soltar varios a la vez.</p><input type="file" id="fi" accept="application/pdf,.pdf" multiple hidden></div>';
  if(UI.impRes.length) h+='<div class="card" style="margin-top:16px"><h2>Resultado</h2>'+UI.impRes.map(function(r){
    var av=r.avisos.map(function(a){return '<div class="small" style="color:var(--warn)">'+esc(a)+'</div>';}).join('');
    return '<div class="alert '+(r.ok?(r.avisos.length?'warn':'good'):'bad')+'"><span class="ic">'+(r.ok?'✓':'!')+'</span><div><b>'+esc(r.nombre)+'</b>'+(r.ok? ' · '+esc(r.f.tipo)+'<br>'+r.f.nuevos+' movimientos nuevos'+(r.f.dup?' · '+r.f.dup+' ya los tenías (descartados)':''):'')+av+'</div></div>'; }).join('')+'</div>';
  h+='<div class="card" style="margin-top:16px"><h2>Qué PDFs admite</h2><table><tbody>'+
    '<tr><td><b>Revolut · Estado de cuenta</b></td><td class="small">App Revolut › Cuenta EUR › Extracto › PDF. Trae cuenta corriente, apartados y cuenta remunerada. Los movimientos pendientes se ignoran hasta que salgan como completados.</td></tr>'+
    '<tr><td><b>Revolut · Tarjeta de crédito</b></td><td class="small">El extracto mensual de la tarjeta. Actualiza la deuda y las compras fraccionadas.</td></tr>'+
    '<tr><td><b>Trade Republic · Extracto de cuenta</b></td><td class="small">Aportaciones, compras y ventas del ETF.</td></tr>'+
    '<tr><td><b>Trade Republic · Extracto del patrimonio</b></td><td class="small">Valor de tu cartera en una fecha.</td></tr></tbody></table>'+
    '<p class="small muted" style="margin:10px 0 0">BBVA no entra por PDF: sus movimientos se añaden a mano en Movimientos o con la plantilla mensual de Ajustes.</p></div>';
  h+='<div class="card"><h2>Extractos importados</h2>'+(S.files.length? '<div class="tablewrap"><table><thead><tr><th>Archivo</th><th>Tipo</th><th>Periodo</th><th class="r">Nuevos</th><th>Importado</th><th></th></tr></thead><tbody>'+S.files.slice().reverse().map(function(f){
    return '<tr><td>'+esc(f.nombre)+'</td><td>'+esc(f.tipo)+'</td><td class="num">'+(f.desde?fechaCorta(f.desde)+(f.hasta&&f.hasta!==f.desde?' – '+fechaCorta(f.hasta):''):'')+'</td><td class="r num">'+f.nuevos+'</td><td class="num">'+fechaCorta(f.cuando)+'</td><td class="r"><button class="btn sm danger" data-act="delFile" data-id="'+f.id+'">Quitar</button></td></tr>'; }).join('')+'</tbody></table></div>' : '<div class="empty">Ninguno todavía.</div>')+'</div>';
  return h;
};
POST.importar=function(m){
  var d=$('#drop',m), fi=$('#fi',m);
  d.onclick=function(){fi.click();}; d.onkeydown=function(e){ if(e.key==='Enter'||e.key===' '){e.preventDefault();fi.click();} };
  fi.onchange=function(){ if(fi.files.length) importar(Array.prototype.slice.call(fi.files)); };
  d.ondragover=function(e){e.preventDefault();d.classList.add('over');}; d.ondragleave=function(){d.classList.remove('over');};
  d.ondrop=function(e){e.preventDefault();d.classList.remove('over'); if(e.dataTransfer.files.length) importar(Array.prototype.slice.call(e.dataTransfer.files));};
};

VISTA.ajustes=function(){
  var rk=Object.keys(S.rules).sort(), h=cab('Ajustes','Copia de seguridad, BBVA, reglas aprendidas y contraseña.');
  var dias = S.lastBackup ? Math.round((new Date(hoy())-new Date(S.lastBackup))/864e5) : null;
  h+='<div class="card"><h2>Copia de seguridad</h2><p>Tus datos viven cifrados dentro de esta app en este dispositivo. Si borras la app o sus datos, se pierden. La copia también sirve para pasar tus datos del ordenador al iPhone y al revés. Guarda una copia de vez en cuando.</p>'+
    '<p class="small '+(dias===null||dias>35?'':'muted')+'" style="'+(dias===null||dias>35?'color:var(--warn)':'')+'">'+(dias===null?'Nunca has hecho una copia.':'Última copia: hace '+dias+' días.')+'</p>'+
    '<div class="row"><button class="btn pri" data-act="exportar">Guardar copia</button><button class="btn" data-act="restaurar">Restaurar una copia</button><input type="file" id="fr" accept=".mfin,.json" hidden></div><p class="small muted" style="margin:10px 0 0">La copia va cifrada con tu contraseña actual. Para restaurarla hará falta esa misma contraseña.</p></div>';
  h+='<div class="card"><h2>BBVA: movimientos fijos del mes</h2><p class="small muted">Como BBVA no te da extractos, esta plantilla añade de golpe tus movimientos fijos del mes elegido. Después puedes editarlos o añadir otros en Movimientos.</p>'+
    '<div class="tablewrap"><table><thead><tr><th>Concepto</th><th class="r" style="width:120px">Importe</th><th style="width:70px">Día</th><th>Categoría</th><th></th></tr></thead><tbody>'+S.plantilla.map(function(p,i){
      return '<tr><td><input type="text" data-pl="'+i+'" data-k="d" value="'+esc(p.d)+'"></td><td><input type="number" step="0.01" data-pl="'+i+'" data-k="imp" value="'+p.imp+'"></td><td><input type="number" min="1" max="31" data-pl="'+i+'" data-k="dia" value="'+p.dia+'"></td><td><select data-pl="'+i+'" data-k="cat">'+catOpts(p.cat)+'</select></td><td class="r"><button class="btn sm danger" data-act="delPl" data-i="'+i+'">Quitar</button></td></tr>'; }).join('')+'</tbody></table></div>'+
    '<div class="row" style="margin-top:12px"><button class="btn" data-act="addPl">Añadir fila</button><span style="flex:1"></span><input type="month" id="plMes" value="'+hoy().slice(0,7)+'"><button class="btn pri" data-act="aplicarPl">Añadir a BBVA en ese mes</button></div><p class="small muted" style="margin:8px 0 0">Gastos en negativo, ingresos en positivo.</p></div>';
  h+='<div class="card"><h2>Reglas aprendidas ('+rk.length+')</h2>'+(rk.length? '<div class="tablewrap" style="max-height:320px;overflow:auto"><table><thead><tr><th>Cuando el movimiento se llama</th><th>Va a</th><th></th></tr></thead><tbody>'+rk.map(function(k){return '<tr><td>'+esc(k)+'</td><td>'+esc(cat(S.rules[k]).n)+'</td><td class="r"><button class="btn sm" data-act="delRule" data-k="'+esc(k)+'">Olvidar</button></td></tr>';}).join('')+'</tbody></table></div>' : '<p class="muted">Aún ninguna. Cada vez que cambies la categoría de un movimiento se creará una.</p>')+'</div>';
  h+='<div class="card"><h2>Categorías</h2><div class="row"><input type="text" id="ncN" placeholder="Nombre de la nueva categoría"><select id="ncT"><option value="g">Gasto</option><option value="i">Ingreso</option><option value="t">Traspaso</option></select><label class="row small"><input type="checkbox" id="ncF"> Vigilar como fuga</label><button class="btn" data-act="addCat">Añadir</button></div>'+
    '<div style="margin-top:12px">'+S.cats.filter(function(c){return c.t==='g';}).map(function(c){return '<label class="pill" style="margin:0 6px 6px 0;cursor:pointer"><input type="checkbox" data-fuga="'+c.id+'"'+(c.fuga?' checked':'')+'> '+esc(c.n)+'</label>';}).join('')+'</div><p class="small muted" style="margin:6px 0 0">Las marcadas se vigilan como fugas: salen en naranja y generan alerta al pasar su límite.</p></div>';
  h+='<div class="card"><h2>Contraseña</h2><div class="row"><input type="password" id="np1" placeholder="Nueva contraseña" autocomplete="new-password"><input type="password" id="np2" placeholder="Repítela" autocomplete="new-password"><button class="btn" data-act="cambiarPass">Cambiar contraseña</button></div></div>';
  h+='<div class="card"><h2>Privacidad</h2><p class="small" style="margin:0">'+(ES_WEB?'La app se descarga una vez desde su dirección web y después funciona sin conexión. No envía nada a ningún sitio: tiene bloqueada cualquier conexión externa. Los PDFs se leen en este dispositivo y los datos se guardan cifrados (AES-256) con tu contraseña, solo aquí.':'Esta app no se conecta a internet: tiene bloqueada cualquier conexión externa. Los PDFs se leen en tu ordenador y los datos se guardan cifrados (AES-256) con tu contraseña.')+'</p></div>';
  return h;
};

/* ---------- dialogos ---------- */
function dialogo(titulo, campos, botones, onOk, onDel){
  var d=$('#dlg');
  d.innerHTML='<form method="dialog"><h2>'+titulo+'</h2><div class="grid g2">'+campos+'</div><div class="row between"><div>'+(onDel?'<button type="button" class="btn danger" id="dDel">Eliminar</button>':'')+'</div><div class="row"><button type="button" class="btn" id="dNo">Cancelar</button><button class="btn pri" id="dOk">'+(botones||'Guardar')+'</button></div></div></form>';
  $('#dNo',d).onclick=function(){d.close();};
  if(onDel) $('#dDel',d).onclick=function(){ onDel(); d.close(); guardar(); render(); };
  $('form',d).onsubmit=function(e){ e.preventDefault(); var v={}; $$('[name]',d).forEach(function(el){ v[el.name]= el.type==='checkbox'? el.checked : el.value; }); if(onOk(v)!==false){ d.close(); guardar(); render(); } };
  d.showModal();
}
function fld(l,html,full){ return '<label class="field"'+(full?' style="grid-column:1/-1"':'')+'>'+l+html+'</label>'; }
function dlgMov(id){
  var t = id ? S.txs.filter(function(t){return t.id===id;})[0] : {f:hoy(), c:'bbva', d:'', imp:0, cat:'otros', nuevo:1};
  var man=CUENTAS;
  dialogo(t.nuevo?'Añadir movimiento':'Editar movimiento',
    fld('Fecha','<input type="date" name="f" value="'+t.f+'" required>')+
    fld('Cuenta','<select name="c">'+man.map(function(c){return '<option value="'+c.id+'"'+(c.id===t.c?' selected':'')+'>'+esc(c.n)+'</option>';}).join('')+'</select>')+
    fld('Descripción','<input type="text" name="d" value="'+esc(t.d)+'" required>',1)+
    fld('Tipo','<select name="s"><option value="-1"'+(t.imp<=0?' selected':'')+'>Gasto / sale dinero</option><option value="1"'+(t.imp>0?' selected':'')+'>Ingreso / entra dinero</option></select>')+
    fld('Importe (€)','<input type="number" name="imp" step="0.01" min="0" value="'+(Math.abs(t.imp)||'')+'" required>')+
    fld('Categoría','<select name="cat">'+catOpts(t.cat)+'</select>',1),
    null, function(v){ var imp=r2(toNum(v.imp)*(+v.s)); if(!imp){ toast('Pon un importe.'); return false; }
      if(t.nuevo){ var n={id:S.nextId++, f:v.f, c:v.c, d:v.d.trim(), det:'Añadido a mano', imp:imp, sal:null, cat:v.cat, man:1, src:'manual', ord:v.f+'|m|'+S.nextId}; S.txs.push(n); UI.mes=mesDe(v.f); }
      else { t.f=v.f; t.c=v.c; t.d=v.d.trim(); t.imp=imp; t.cat=v.cat; t.man=1; }
    }, t.nuevo?null:function(){ S.txs=S.txs.filter(function(x){return x.id!==id;}); });
}
function dlgDeuda(id){
  var d = id ? S.debts.filter(function(x){return x.id===id;})[0] : {n:'',pend:'',cuota:'',fin:'',nota:'',nuevo:1};
  dialogo(d.nuevo?'Añadir deuda':'Editar deuda',
    fld('Nombre','<input type="text" name="n" value="'+esc(d.n)+'" required>',1)+fld('Pendiente (€)','<input type="number" step="0.01" min="0" name="pend" value="'+d.pend+'" required>')+fld('Cuota mensual (€)','<input type="number" step="0.01" min="0" name="cuota" value="'+(d.cuota||'')+'">')+
    fld('Termina en','<input type="month" name="fin" value="'+(d.fin||'')+'">')+fld('Nota','<input type="text" name="nota" value="'+esc(d.nota||'')+'">'),
    null, function(v){ var o={n:v.n.trim(), pend:toNum(v.pend), cuota:toNum(v.cuota), fin:v.fin, nota:v.nota}; if(d.nuevo){ o.id=S.nextId++; S.debts.push(o); } else Object.assign(d,o); },
    d.nuevo?null:function(){ S.debts=S.debts.filter(function(x){return x.id!==id;}); });
}
function dlgSub(id, pre){
  var s = id ? S.subs.filter(function(x){return x.id===id;})[0] : Object.assign({n:'',imp:'',match:'',exact:0,on:1,nota:'',nuevo:1}, pre||{});
  dialogo(s.nuevo?'Añadir suscripción':'Editar suscripción',
    fld('Nombre','<input type="text" name="n" value="'+esc(s.n)+'" required>',1)+fld('Importe al mes (€)','<input type="number" step="0.01" min="0" name="imp" value="'+s.imp+'" required>')+
    fld('Texto del cargo en el extracto','<input type="text" name="match" value="'+esc(s.match||'')+'" placeholder="p. ej. netflix">')+
    fld('Nota','<input type="text" name="nota" value="'+esc(s.nota||'')+'">',1)+
    '<label class="row small"><input type="checkbox" name="exact"'+(s.exact?' checked':'')+'> Exigir importe exacto (útil con Apple)</label><label class="row small"><input type="checkbox" name="on"'+(s.on?' checked':'')+'> Activa</label>',
    null, function(v){ var o={n:v.n.trim(), imp:toNum(v.imp), match:v.match.trim(), exact:v.exact?1:0, on:v.on?1:0, nota:v.nota}; if(s.nuevo){ o.id=S.nextId++; S.subs.push(o); } else Object.assign(s,o); },
    s.nuevo?null:function(){ S.subs=S.subs.filter(function(x){return x.id!==id;}); });
}
function dlgSaldo(id){
  dialogo('Fijar saldo de '+cuentaN(id), fld('Saldo real (€)','<input type="number" step="0.01" name="v" value="'+(saldoCuenta(id)||0)+'" required>')+fld('A fecha','<input type="date" name="f" value="'+hoy()+'" required>')+
    '<p class="small muted" style="grid-column:1/-1;margin:0">Mira el saldo en la app del banco y ponlo aquí. Los movimientos que añadas con fecha posterior se sumarán solos.</p>',
    null, function(v){ S.manual[id]={base:toNum(v.v), fecha:v.f}; });
}
function dlgTR(){
  var vc=valorCartera();
  dialogo('Valor de la cartera en Trade Republic', fld('Valor actual (€)','<input type="number" step="0.01" min="0" name="v" value="'+(vc?vc.v:'')+'" required>')+fld('A fecha','<input type="date" name="f" value="'+hoy()+'" required>'),
    null, function(v){ S.trSnaps=S.trSnaps.filter(function(s){return s.f!==v.f;}); S.trSnaps.push({f:v.f, v:toNum(v.v), src:'manual'}); });
}

/* ---------- copia de seguridad ---------- */
async function exportar(){
  S.lastBackup=hoy(); var c=await cifrar(S); await guardar();
  var txt=JSON.stringify({app:'misfinanzas', v:1, salt:b64(c.salt), iv:b64(c.iv), ct:b64(c.ct)});
  var nombre='mis-finanzas-copia-'+hoy()+'.mfin';
  if(ES_IOS && navigator.canShare){
    try{ var fl=new File([txt],nombre,{type:'application/octet-stream'}); if(navigator.canShare({files:[fl]})){ await navigator.share({files:[fl], title:'Copia de Mis Finanzas'}); toast('Copia lista. Guárdala en Archivos o pásala por AirDrop.'); render(); return; } }
    catch(e){ if(e && e.name==='AbortError'){ render(); return; } }
  }
  var a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([txt],{type:'application/octet-stream'})); a.download=nombre; a.click(); setTimeout(function(){URL.revokeObjectURL(a.href);},5000);
  toast(ES_IOS?'Copia guardada en Archivos › Descargas.':'Copia guardada en tu carpeta de Descargas.'); render();
}
async function restaurar(file){
  try{
    var j=JSON.parse(await file.text()); if(j.app!=='misfinanzas') throw new Error('x');
    var pass=prompt('Contraseña con la que se hizo esa copia:'); if(pass===null) return;
    var salt=unb64(j.salt), k=await derivar(pass,salt), datos;
    try{ datos=await descifrar({iv:unb64(j.iv), ct:unb64(j.ct)}, k); }catch(e){ toast('Contraseña incorrecta para esa copia.'); return; }
    if(!confirm('Se sustituirán los datos actuales por los de la copia ('+datos.txs.length+' movimientos). ¿Continuar?')) return;
    S=datos; migrar(); KEY=k; SALT=salt; await guardar(); UI.mes=mesInicial(); toast('Copia restaurada. La contraseña vuelve a ser la de la copia.'); render();
  }catch(e){ toast('Ese archivo no es una copia válida de Mis Finanzas.'); }
}

/* ---------- eventos ---------- */
function toast(t){ var e=$('#toast'); e.textContent=t; e.style.display='block'; clearTimeout(toast.t); toast.t=setTimeout(function(){e.style.display='none';},4200); }
document.addEventListener('click', function(e){
  var el=e.target.closest('[data-v],[data-act],[data-go-cat],[data-set-mes]'); if(!el) return;
  if(el.dataset.v){ UI.vista=el.dataset.v; UI.lim=150; render(); window.scrollTo(0,0); return; }
  if(el.dataset.goCat){ e.preventDefault(); UI.vista='movimientos'; UI.fCat=el.dataset.goCat; UI.fCuenta=''; UI.fTxt=''; UI.fMes=''; render(); window.scrollTo(0,0); return; }
  if(el.dataset.setMes){ UI.mes=el.dataset.setMes; render(); return; }
  var a=el.dataset.act, id=+el.dataset.id;
  if(a==='mes'){ UI.mes=mesSig(UI.mes,+el.dataset.d); UI.fMes=''; render(); }
  else if(a==='mas'){ UI.lim+=300; render(); }
  else if(a==='bloquear'){ location.reload(); }
  else if(a==='nuevoMov') dlgMov(); else if(a==='editMov') dlgMov(id);
  else if(a==='nuevaDeuda') dlgDeuda(); else if(a==='editDeuda') dlgDeuda(id);
  else if(a==='nuevaSub') dlgSub(); else if(a==='editSub') dlgSub(id);
  else if(a==='addCand'){ var c=candidatas()[+el.dataset.i]; if(c) dlgSub(null,{n:c.d, imp:c.imp, match:c.d.toLowerCase(), exact:0}); }
  else if(a==='fijarSaldo') dlgSaldo(el.dataset.id); else if(a==='valorTR') dlgTR();
  else if(a==='delFile'){ var f=S.files.filter(function(x){return x.id===el.dataset.id;})[0]; if(f && confirm('¿Quitar «'+f.nombre+'» y los '+f.nuevos+' movimientos que trajo?')){ borrarFichero(f.id); guardar(); render(); } }
  else if(a==='exportar') exportar();
  else if(a==='restaurar'){ var fr=$('#fr'); fr.onchange=function(){ if(fr.files[0]) restaurar(fr.files[0]); }; fr.click(); }
  else if(a==='delRule'){ delete S.rules[el.dataset.k]; guardar(); render(); }
  else if(a==='addPl'){ S.plantilla.push({d:'',imp:0,cat:'otros',dia:1}); guardar(); render(); }
  else if(a==='delPl'){ S.plantilla.splice(+el.dataset.i,1); guardar(); render(); }
  else if(a==='aplicarPl'){ var ym=$('#plMes').value; if(!ym) return; var tag='plantilla:'+ym;
    if(S.txs.some(function(t){return t.tag===tag;}) && !confirm('Ya añadiste la plantilla en '+mesLargo(ym)+'. ¿Añadirla otra vez?')) return;
    var n=0, ult=+finDeMes(ym).slice(8,10); S.plantilla.forEach(function(p){ if(!p.d||!p.imp) return; var f=ym+'-'+p2(Math.min(ult,Math.max(1,+p.dia||1)));
      S.txs.push({id:S.nextId++, f:f, c:'bbva', d:p.d, det:'Plantilla mensual BBVA', imp:r2(+p.imp), sal:null, cat:p.cat, man:1, src:'manual', tag:tag, ord:f+'|m|'+S.nextId}); n++; });
    guardar(); toast(n+' movimientos añadidos a BBVA en '+mesLargo(ym)+'.'); render(); }
  else if(a==='addCat'){ var nn=$('#ncN').value.trim(); if(!nn) return; var cid='c'+(S.nextId++); S.cats.push({id:cid,n:nn,t:$('#ncT').value,fuga:$('#ncF').checked&&$('#ncT').value==='g'?1:0}); if($('#ncT').value==='g') S.budget[cid]=0; guardar(); render(); }
  else if(a==='cambiarPass'){ var p1=$('#np1').value, pp=$('#np2').value; if(p1.length<6){ toast('Mínimo 6 caracteres.'); return; } if(p1!==pp){ toast('Las contraseñas no coinciden.'); return; }
    (async function(){ SALT=crypto.getRandomValues(new Uint8Array(16)); KEY=await derivar(p1,SALT); await guardar(); toast('Contraseña cambiada.'); render(); })(); }
});
document.addEventListener('change', function(e){
  var el=e.target, d=el.dataset;
  if(d.cat){ cambiarCat(+d.cat, el.value); guardar(); render(); }
  else if(d.ch==='mes'){ UI.mes=el.value; UI.fMes=''; render(); }
  else if(d.ch==='todosMeses'){ UI.fMes=el.checked?'todos':''; render(); }
  else if(d.ch==='fCuenta'){ UI.fCuenta=el.value; render(); }
  else if(d.ch==='fCat'){ UI.fCat=el.value; render(); }
  else if(d.bud){ S.budget[d.bud]=Math.max(0,toNum(el.value)); guardar(); render(); }
  else if(d.num==='income'){ S.income=toNum(el.value); guardar(); render(); }
  else if(d.num==='diaInicio'){ S.diaInicio=Math.min(28,Math.max(1,Math.round(toNum(el.value))||1)); UI.mes=mesInicial(); guardar(); render(); }
  else if(d.pl!==undefined){ var p=S.plantilla[+d.pl]; p[d.k]= d.k==='imp'?toNum(el.value): d.k==='dia'?(+el.value||1): el.value; guardar(); }
  else if(d.fuga){ cat(d.fuga).fuga=el.checked?1:0; guardar(); }
});
var tIn; document.addEventListener('input', function(e){ if(e.target.dataset.in==='fTxt'){ UI.fTxt=e.target.value; clearTimeout(tIn); tIn=setTimeout(function(){ render(); var i=$('[data-in=fTxt]'); if(i){ i.focus(); i.setSelectionRange(i.value.length,i.value.length); } },250); } });
document.addEventListener('mousemove', function(e){ var t=e.target.closest&&e.target.closest('[data-tip]'), tip=$('#tip'); if(!t){ tip.style.display='none'; return; }
  tip.textContent=t.dataset.tip; tip.style.display='block'; var w=tip.offsetWidth; tip.style.left=Math.min(window.innerWidth-w-8, e.clientX+14)+'px'; tip.style.top=(e.clientY+16)+'px'; });
window.addEventListener('dragover', function(e){e.preventDefault();}); window.addEventListener('drop', function(e){e.preventDefault();});
arrancar();
