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
  if(typeof PERFIL_INICIAL==='function'){ var p=PERFIL_INICIAL(); for(var k in p) base[k]=p[k]; base.ajTs=1; }
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
function totalGasto(ym){ var g=gastoPorCat(ym), s=0; for(var k in g) if(g[k]>0) s+=g[k]; return r2(s); } // lo que te devuelven en una categoría no resta de otras
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
  S.txs.forEach(function(t){ if(t.src===fid) borrado(t); });
  S.files.forEach(function(f){ if(f.id===fid){ S.del=S.del||{}; S.del['f:'+claveFich(f)]=hoy(); } });
  S.txs = S.txs.filter(function(t){return t.src!==fid;});
  S.trSnaps = S.trSnaps.filter(function(s){return s.src!==fid;});
  if(S.card && S.card.src===fid) S.card=null;
  S.files = S.files.filter(function(f){return f.id!==fid;});
}

/* ---------- aprendizaje de categorias ---------- */
function cambiarCat(id, nueva){
  var t = S.txs.filter(function(t){return t.id===id;})[0]; if(!t) return;
  t.cat=nueva; t.man=1; tocar(t);
  var k=norm(t.d), n=0;
  if(k){ S.rules[k]=nueva; S.txs.forEach(function(o){ if(o!==t && !o.man && norm(o.d)===k && o.cat!==nueva){ o.cat=nueva; tocar(o); n++; } }); }
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
function guardar(){ if(typeof sellar==='function') sellar(); guardando = guardando.then(async function(){ await idbSet('data', await cifrar(S)); }).catch(function(e){ toast('Error al guardar: '+e.message); }); return guardando; }
function b64(u8){ var s=''; for(var i=0;i<u8.length;i+=0x8000) s+=String.fromCharCode.apply(null,u8.subarray(i,i+0x8000)); return btoa(s); }
function unb64(s){ var b=atob(s), u=new Uint8Array(b.length); for(var i=0;i<b.length;i++) u[i]=b.charCodeAt(i); return u; }

async function arrancar(){
  var lock=$('#lock');
  if(!window.crypto || !crypto.subtle || !window.indexedDB){ lock.innerHTML='<div class="card"><h1>No se puede abrir</h1><p>Este navegador no permite cifrar los datos. Abre la app con Microsoft Edge o Google Chrome.</p></div>'; return; }
  var blob = await idbGet('data');
  if(!blob){
    lock.innerHTML='<form class="card"><div class="logo">🐷</div><h1>Mis Finanzas</h1><p class="sub">Crea tu contraseña 🔐</p>'+
      '<input type="password" id="p1" placeholder="Contraseña (mínimo 6 caracteres)" autocomplete="new-password" autofocus><input type="password" id="p2" placeholder="Repite la contraseña" autocomplete="new-password">'+
      '<button class="btn pri">Crear y entrar</button><div class="err"></div><p class="small muted" style="margin:6px 0 0">Si olvidas la contraseña no hay forma de recuperar los datos. Apúntala.</p></form>';
    $('#lock form').onsubmit=async function(e){ e.preventDefault(); var a=$('#p1').value, b=$('#p2').value;
      if(a.length<6){ $('#lock .err').textContent='Mínimo 6 caracteres.'; return; }
      if(a!==b){ $('#lock .err').textContent='Las contraseñas no coinciden.'; return; }
      SALT=crypto.getRandomValues(new Uint8Array(16)); KEY=await derivar(a,SALT); S=estadoInicial(); await guardar(); entrar(); };
  } else {
    lock.innerHTML='<form class="card"><div class="logo">🐷</div><h1>Mis Finanzas</h1><p class="sub">Hola de nuevo 👋</p><input type="password" id="p1" placeholder="Contraseña" autocomplete="current-password" autofocus><button class="btn pri">Entrar</button><div class="err"></div></form>';
    $('#lock form').onsubmit=async function(e){ e.preventDefault(); $('#lock .err').textContent='Comprobando…';
      try{ var k=await derivar($('#p1').value, blob.salt); S=await descifrar(blob,k); KEY=k; SALT=blob.salt; migrar(); entrar(); }
      catch(err){ $('#lock .err').textContent='Contraseña incorrecta.'; $('#p1').select(); } };
  }
}
function migrar(){ var d=estadoInicial(); for(var k in d) if(S[k]===undefined) S[k]=d[k]; }
function entrar(){ try{ if(navigator.storage && navigator.storage.persist) navigator.storage.persist(); }catch(e){} $('#lock').style.display='none'; $('#app').style.display=''; UI.mes = mesInicial(); _mv=movil(); render(); }
function mesInicial(){ var m=meses(), h=mesDe(hoy()); if(txMes(h).length) return h; var con=m.filter(function(x){return txMes(x).length;}); return con.length?con[con.length-1]:h; }

/* ================= interfaz ================= */
var VISTAS=[['resumen','Inicio'],['movimientos','Movimientos'],['presupuesto','Presupuesto'],['deudas','Deudas'],['patrimonio','Patrimonio'],['suscripciones','Suscripciones'],['importar','Importar PDFs'],['ajustes','Ajustes']];
var EN_MAS={presupuesto:1,deudas:1,patrimonio:1,suscripciones:1,importar:1,ajustes:1,mas:1};
function movil(){ return window.matchMedia('(max-width:720px)').matches; }
var ICO={
  inicio:'<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  movs:'<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  mas:'<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><circle cx="5" cy="12" r="1.8" fill="currentColor"/><circle cx="12" cy="12" r="1.8" fill="currentColor"/><circle cx="19" cy="12" r="1.8" fill="currentColor"/></svg>',
  plus:'<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>'
};
function render(){
  var al = S.txs.length ? alertas(UI.mes).filter(function(a){return a.k==='bad';}).length : 0;
  var nav=$('nav'), mv=movil();
  if(!mv && UI.vista==='mas') UI.vista='resumen';
  if(mv){
    var on=function(v){ return v==='resumen' ? UI.vista==='resumen' : v==='movimientos' ? UI.vista==='movimientos' : !!EN_MAS[UI.vista]; };
    nav.className='tabs';
    nav.innerHTML='<button data-v="resumen" class="'+(on('resumen')?'on':'')+'">'+ICO.inicio+'<span>Inicio</span>'+(al?'<b class="dot"></b>':'')+'</button>'+
      '<button data-v="movimientos" class="'+(on('movimientos')?'on':'')+'">'+ICO.movs+'<span>Movimientos</span></button>'+
      '<button data-act="rapido" class="plus" aria-label="Añadir">'+ICO.plus+'</button>'+
      '<button data-v="mas" class="'+(on('mas')?'on':'')+'">'+ICO.mas+'<span>Más</span></button>';
  } else {
    nav.className='';
    nav.innerHTML='<div class="brand"><i></i>Mis Finanzas</div><button class="btn pri addbtn" data-act="rapido">+ Añadir gasto</button>'+VISTAS.map(function(v){ return '<button data-v="'+v[0]+'" class="'+(UI.vista===v[0]?'on':'')+'">'+v[1]+(v[0]==='resumen'&&al?'<span class="badge">'+al+'</span>':'')+'</button>'; }).join('')+
      '<div class="spacer"></div><button data-act="bloquear">Bloquear</button>';
  }
  var m=$('main');
  m.innerHTML = (mv && EN_MAS[UI.vista] && UI.vista!=='mas' ? '<button class="volver" data-v="mas">‹ Más</button>' : '') + VISTA[UI.vista]();
  if(POST[UI.vista]) POST[UI.vista](m);
}
var _mv=null; window.addEventListener('resize', function(){ var m=movil(); if(S && KEY && m!==_mv){ _mv=m; render(); } });
function selMes(){
  var ms=meses(); if(ms.indexOf(UI.mes)<0) ms.push(UI.mes); ms.sort();
  return '<div class="row"><button class="btn" data-act="mes" data-d="-1" aria-label="Mes anterior">‹</button><select data-ch="mes">'+ms.map(function(x){return '<option value="'+x+'"'+(x===UI.mes?' selected':'')+'>'+mesEtq(x)+'</option>';}).join('')+'</select><button class="btn" data-act="mes" data-d="1" aria-label="Mes siguiente">›</button></div>';
}
function cab(t, sub, extra){ return '<div class="row between" style="margin-bottom:14px;align-items:flex-start"><div><h1>'+t+'</h1><div class="sub" style="margin:0">'+sub+'</div></div>'+(extra||'')+'</div>'; }
function vacio(){ return '<div class="card empty"><p><b>Todavía no hay datos.</b></p><p>Empieza importando tus extractos en PDF de Revolut y Trade Republic.</p><button class="btn pri" data-v="importar">Importar PDFs</button></div>'; }
function barra(v, lim){ var p = lim>0 ? Math.min(100, v/lim*100) : (v>0?100:0); var cl = v>lim+0.005 ? 'over' : (lim>0 && v/lim>0.85 ? 'near':''); return '<div class="bar '+cl+'"><i style="width:'+p.toFixed(1)+'%"></i></div>'; }

var VISTA={}, POST={};
/* ================= Vistas (diseño minimalista con iconos) ================= */
var EMO={
  alquiler:['🏠','#2a78d6'], super:['🛒','#1baf7a'], restaurantes:['🍽️','#eb6834'], delivery:['🛵','#e34948'],
  transporte:['🚇','#6250d6'], uber:['🚕','#eda100'], estanco:['🚬','#e87ba4'], apuestas:['🎰','#e34948'],
  videojuegos:['🎮','#6250d6'], suscripciones:['📱','#2a78d6'], master:['🎓','#008300'], salud:['💊','#1baf7a'],
  compras:['🛍️','#e87ba4'], ocio:['🎬','#eda100'], viajes:['✈️','#2a78d6'], deporte:['🏃','#008300'],
  plazos:['🧾','#e34948'], familia:['👨‍👩‍👦','#eb6834'], personas:['👥','#6250d6'], comisiones:['🏦','#e34948'],
  cajero:['🏧','#85837c'], otros:['📦','#85837c'], nomina:['💼','#17803d'], intereses:['📈','#17803d'],
  otros_ing:['💰','#17803d'], traspaso:['🔁','#85837c'], inversion:['📊','#2a78d6'], pago_tarjeta:['💳','#85837c']
};
function emo(id){ return (EMO[id]||['🏷️','#85837c'])[0]; }
function col(id){ return (EMO[id]||['','#85837c'])[1]; }
function av(id, big){ return '<span class="av'+(big?' big':'')+'" style="--c:'+col(id)+'">'+emo(id)+'</span>'; }
function tc(s){ return s.toLowerCase().replace(/(^|[\s\-/(])([a-záéíóúñ])/g,function(m,a,b){return a+b.toUpperCase();}); }
function nombre(t){
  var d=t.d||'', m;
  if((m=/^Transferencia (a|de) (.+)$/i.exec(d))){ var n=tc(m[2]).split(' ').slice(0,2).join(' '); return (m[1].toLowerCase()==='a'?'Para ':'De ')+n; }
  if((m=/^Para guardar EUR (.+?) de EUR en Apartado/i.exec(d))) return 'A apartado · '+m[1].replace(/\s*\S*[\uD800-\uDFFF]+\S*\s*/g,' ').trim();
  if(/^Retiro de Apartado/i.test(d)) return 'Sacado de apartado';
  if(/^Un dep[oó]sito de Apple Pay/i.test(d)) return 'Recarga con tarjeta';
  if(/^To EUR/i.test(d) && t.c==='revolut') return t.imp>0?'Desde tarjeta de crédito':'Pago a tarjeta de crédito';
  if(/^To EUR/i.test(d) && t.c==='revolut_tarjeta') return t.imp<0?'Pasado a tu cuenta':'Pago recibido';
  if(/^Buy trade/i.test(d)) return 'Compra ETF S&P 500';
  if(/^Sell trade/i.test(d)) return 'Venta ETF S&P 500';
  if(/^Apple Pay Top up/i.test(d)) return 'Recarga';
  if(/^Inter[eé]s neto/i.test(d)) return 'Intereses';
  if(/^Cargo por intereses/i.test(d)) return 'Intereses de la tarjeta';
  if(/^(From|To) /i.test(d) && t.c!=='tr') return d.replace(/^From /i,'Desde ').replace(/^To /i,'A ');
  if(d===d.toUpperCase() && /[A-Z]{3}/.test(d)) return tc(d);
  return d;
}
function mesNav(){
  var ms=meses(); if(ms.indexOf(UI.mes)<0) ms.push(UI.mes); ms.sort();
  var lab=MES_N[+UI.mes.slice(5,7)-1]; lab=lab[0].toUpperCase()+lab.slice(1)+(UI.mes.slice(0,4)!==hoy().slice(0,4)?' '+UI.mes.slice(0,4):'');
  return '<div class="mesnav"><button class="ib" data-act="mes" data-d="-1" aria-label="Mes anterior">‹</button><label class="meslab">'+lab+
    '<select data-ch="mes" aria-label="Elegir mes">'+ms.map(function(x){return '<option value="'+x+'"'+(x===UI.mes?' selected':'')+'>'+mesEtq(x)+'</option>';}).join('')+'</select></label><button class="ib" data-act="mes" data-d="1" aria-label="Mes siguiente">›</button></div>';
}
function titulo(t, extra){ return '<div class="vtop"><h1>'+t+'</h1>'+(extra||'')+'</div>'; }
function anillo(pct, color, centro, size){
  size=size||184; var r=size/2-12, c=2*Math.PI*r, p=Math.max(0,Math.min(1,pct));
  return '<div class="ring" style="width:'+size+'px;height:'+size+'px"><svg viewBox="0 0 '+size+' '+size+'" width="'+size+'" height="'+size+'" aria-hidden="true">'+
    '<circle cx="'+size/2+'" cy="'+size/2+'" r="'+r+'" fill="none" stroke="var(--surface-2)" stroke-width="14"/>'+
    (p>0?'<circle cx="'+size/2+'" cy="'+size/2+'" r="'+r+'" fill="none" stroke="'+color+'" stroke-width="14" stroke-linecap="round" stroke-dasharray="'+(c*p).toFixed(1)+' '+c.toFixed(1)+'" transform="rotate(-90 '+size/2+' '+size/2+')"/>':'')+
    '</svg><div class="rc">'+centro+'</div></div>';
}
function donut(items, total, centro){
  var S2=150, r=58, c=2*Math.PI*r, off=0, s='<svg viewBox="0 0 '+S2+' '+S2+'" width="'+S2+'" height="'+S2+'" aria-hidden="true"><circle cx="75" cy="75" r="'+r+'" fill="none" stroke="var(--surface-2)" stroke-width="18"/>';
  items.forEach(function(it){ var l=total>0? it.v/total*c : 0; if(l<1) return; var gap=Math.min(3,l/3);
    s+='<circle cx="75" cy="75" r="'+r+'" fill="none" stroke="'+it.c+'" stroke-width="18" stroke-dasharray="'+(l-gap).toFixed(1)+' '+(c-l+gap).toFixed(1)+'" stroke-dashoffset="'+(-off).toFixed(1)+'" transform="rotate(-90 75 75)"/>'; off+=l; });
  return '<div class="donut"><div style="position:relative;width:150px;height:150px">'+s+'</svg><div class="rc">'+centro+'</div></div></div>';
}

/* ---------- Inicio ---------- */
function pasosInicio(){
  return [
    {ok:S.income>0, e:'💼', t:'Sueldo', act:'data-act="iniIncome"'},
    {ok:S.files.length>0||S.txs.length>0, e:'📄', t:'Extractos', act:'data-act="pickPDF"'},
    {ok:!!(S.manual.bbva&&S.manual.bbva.set), e:'🏛️', t:'Saldo BBVA', act:'data-act="fijarSaldo" data-id="bbva"'},
    {ok:presupuestoTotal()>0, e:'🎯', t:'Límites', act:'data-v="presupuesto"'}
  ];
}
function alertasCortas(ym){
  var out=[], g=gastoPorCat(ym), tx=txMes(ym);
  S.cats.filter(function(c){return c.fuga;}).forEach(function(c){ var v=g[c.id]||0, lim=+S.budget[c.id]||0;
    if(v>lim+0.005) out.push({k:'bad', e:emo(c.id), t:'<b>'+esc(c.n)+'</b> '+eur0(v)+' de '+eur0(lim), go:c.id}); });
  var sum=function(a,f){ return a.reduce(function(s,t){return s+f(t);},0); };
  var ret=tx.filter(function(t){return t.c==='revolut' && t.imp>0 && /^(retiro de apartado|desde eur|from (backup|master|cuenta remunerada))/i.test(t.d);});
  if(ret.length) out.push({k:'warn', e:'🐷', t:'Sacaste <b>'+eur0(sum(ret,function(t){return t.imp;}))+'</b> de tus apartados'});
  var ven=tx.filter(function(t){return t.c==='tr' && /^sell trade/i.test(t.d);});
  if(ven.length) out.push({k:'bad', e:'📉', t:'Vendiste <b>'+eur0(sum(ven,function(t){return t.imp;}))+'</b> de tu ETF'});
  var disp=tx.filter(function(t){return t.c==='revolut' && t.imp>0 && /^to eur/i.test(t.d);});
  if(disp.length) out.push({k:'bad', e:'💳', t:'<b>'+eur0(sum(disp,function(t){return t.imp;}))+'</b> sacados de la tarjeta de crédito'});
  var cc=tx.filter(function(t){return t.c==='revolut_tarjeta' && t.imp<0 && cat(t.cat).t==='g';});
  if(cc.length) out.push({k:'warn', e:'💳', t:'<b>'+eur0(-sum(cc,function(t){return t.imp;}))+'</b> pagados a crédito'});
  var tot=totalGasto(ym), pre=presupuestoTotal();
  if(pre>0 && tot>pre) out.push({k:'bad', e:'🚨', t:'Te has pasado del presupuesto'});
  if(tx.length && !totalIngreso(ym)) out.push({k:'warn', e:'💼', t:'Falta tu nómina de este mes', act:'ingreso'});
  return out;
}
VISTA.resumen=function(){
  var ym=UI.mes, g=gastoPorCat(ym), tot=totalGasto(ym), pre=presupuestoTotal(), pat=patrimonio(), al=S.txs.length?alertasCortas(ym):[];
  var esActual = ym===mesDe(hoy()), quedan=Math.round((new Date(rango(ym).fin)-new Date(hoy()))/864e5)+1, rest=r2(pre-tot);
  var h='<div class="inicio-top">'+mesNav()+'</div>';
  var ps=pasosInicio(), hechos=ps.filter(function(x){return x.ok;}).length;
  if(!S.setupHecho && hechos<ps.length){
    h+='<div class="card setup"><div class="sethead"><b>Empieza aquí</b><span class="muted small">'+hechos+'/'+ps.length+'</span><button class="ib x" data-act="ocultarSetup" aria-label="Ocultar">×</button></div><div class="pasos4">'+
      ps.map(function(x){ return '<button class="paso4'+(x.ok?' ok':'')+'" '+x.act+'><span class="pe">'+x.e+'</span><span>'+x.t+'</span>'+(x.ok?'<i>✓</i>':'')+'</button>'; }).join('')+'</div>'+
      (!ps[1].ok?'<button class="link small" data-act="restaurar">¿Vienes del ordenador? Restaura tu copia</button>':'')+'</div>';
  }
  // anillo principal
  h+='<div class="card hero">';
  if(pre>0){
    var pct=tot/pre, over=rest<0, color= over?'var(--bad)': pct>0.85?'var(--warn)':'var(--good)';
    var cara = over?'🥵': pct>0.85?'😬': pct>0.6?'🙂':'😎';
    h+=anillo(over?1:pct, color, '<div class="cara">'+cara+'</div><div class="rv num" style="color:'+(over?'var(--bad)':'var(--text)')+'">'+eur0(Math.abs(rest))+'</div><div class="rl">'+(over?'te has pasado':'te quedan')+'</div>')+
      '<div class="hchips">'+(esActual&&!over&&quedan>1?'<span class="hchip">📆 <b>'+eur0(rest/quedan)+'</b> al día</span>':'')+'<span class="hchip">💸 <b>'+eur0(tot)+'</b> de '+eur0(pre)+'</span></div>';
  } else {
    h+=anillo(0,'var(--s1)','<div class="cara">💸</div><div class="rv num">'+eur0(tot)+'</div><div class="rl">gastado</div>')+
      '<div class="hchips"><button class="hchip btnchip" data-v="presupuesto">🎯 Pon un límite</button></div>';
  }
  h+='</div>';
  if(al.length){
    var vis = UI.allAl ? al : al.slice(0,3);
    h+='<div class="avisos">'+vis.map(function(a){ return '<button class="aviso '+a.k+'" '+(a.go?'data-go-cat="'+a.go+'"':a.act==='ingreso'?'data-act="rapidoIng"':'tabindex="-1"')+'><span class="ae">'+a.e+'</span><span>'+a.t+'</span></button>'; }).join('')+
      (al.length>3?'<button class="link small" data-act="allAl">'+(UI.allAl?'Ver menos':'+'+(al.length-3)+' más')+'</button>':'')+'</div>';
  }
  var cs = Object.keys(g).filter(function(k){return g[k]>0.005;}).sort(function(a,b){return g[b]-g[a];});
  if(cs.length){
    var top=cs.slice(0,5), resto=cs.slice(5).reduce(function(s,k){return s+g[k];},0);
    var items=top.map(function(k){return {v:g[k], c:col(k)};}); if(resto>0) items.push({v:resto, c:'var(--border)'});
    var visc = UI.allCat ? cs : top;
    h+='<div class="card"><h2>¿En qué se va?</h2><div class="gasto-g">'+donut(items, tot, '<div class="rv sm num">'+eur0(tot)+'</div><div class="rl">gastado</div>')+'<div class="catlist">'+
      visc.map(function(k){ var lim=+S.budget[k]||0, over=lim&&g[k]>lim;
        return '<button class="crow" data-go-cat="'+k+'">'+av(k)+'<span class="cn">'+esc(cat(k).n)+'</span><span class="num cv'+(over?' over':'')+'">'+eur0(g[k])+'</span></button>'; }).join('')+
      (cs.length>5?'<button class="link small" data-act="allCat">'+(UI.allCat?'Ver menos':'Ver todas ('+cs.length+')')+'</button>':'')+'</div></div></div>';
  }
  if(S.txs.length || S.income){
    h+='<div class="tiles"><button class="tile" data-v="patrimonio"><span class="te">💎</span><span class="tl">Patrimonio</span><span class="tv num">'+eur0(pat.neto)+'</span></button>'+
      '<button class="tile" data-v="deudas"><span class="te">🧾</span><span class="tl">Deudas</span><span class="tv num">'+eur0(pat.deudas)+'</span></button></div>';
  }
  if(!movil() && S.txs.length) h+='<div class="card"><h2>Ingresos y gastos</h2>'+chartMeses()+'</div>';
  return h;
};
VISTA.mas=function(){
  var pre=presupuestoTotal(), subs=S.subs.filter(function(x){return x.on;}).reduce(function(a,x){return a+(+x.imp||0);},0), pat=patrimonio();
  var filas=[['presupuesto','🎯','Presupuesto', pre? eur0(totalGasto(UI.mes))+' de '+eur0(pre):''],['deudas','🧾','Deudas', eur0(pat.deudas)],['patrimonio','💎','Patrimonio', eur0(pat.neto)],
    ['suscripciones','📱','Suscripciones', eur0(subs)+'/mes'],['importar','📄','Importar PDFs',''],['ajustes','⚙️','Ajustes','']];
  return titulo('Más')+'<div class="card lista"><button data-act="sync"><span class="le">🔄</span><b>Sincronizar</b><span class="lv muted small">'+haceSync()+'</span><span class="chev">›</span></button></div><div class="card lista">'+filas.map(function(f){ return '<button data-v="'+f[0]+'"><span class="le">'+f[1]+'</span><b>'+f[2]+'</b><span class="lv muted">'+f[3]+'</span><span class="chev">›</span></button>'; }).join('')+'</div>'+
    '<div class="card lista"><button data-act="bloquear"><span class="le">🔒</span><b>Bloquear</b><span class="lv"></span><span class="chev">›</span></button></div>';
};

/* ---------- Movimientos ---------- */
VISTA.movimientos=function(){
  var q=(UI.fTxt||'').toLowerCase().trim(), tipo=UI.fTipo||'';
  var a=S.txs.filter(function(t){ var ct=cat(t.cat).t;
    if(!q && mesDe(t.f)!==UI.mes) return false;
    if(UI.fCat && t.cat!==UI.fCat) return false;
    if(tipo==='g' && ct!=='g') return false; if(tipo==='i' && ct!=='i') return false;
    if(q && (t.d+' '+nombre(t)+' '+cat(t.cat).n).toLowerCase().indexOf(q)<0) return false;
    return true; }).sort(function(x,y){ return x.f<y.f?1:x.f>y.f?-1:(x.ord<y.ord?1:-1); });
  var h=titulo('Movimientos','<button class="ib" data-act="buscar" aria-label="Buscar">🔍</button>');
  if(UI.buscar||q) h+='<input type="search" class="buscar" placeholder="Buscar en todos los meses" data-in="fTxt" value="'+esc(UI.fTxt||'')+'">';
  if(!q) h+=mesNav();
  h+='<div class="seg"><button data-act="fTipo" data-t="" class="'+(!tipo?'on':'')+'">Todo</button><button data-act="fTipo" data-t="g" class="'+(tipo==='g'?'on':'')+'">Gastos</button><button data-act="fTipo" data-t="i" class="'+(tipo==='i'?'on':'')+'">Ingresos</button></div>';
  if(UI.fCat) h+='<button class="chip on filtro" data-act="quitarCat">'+emo(UI.fCat)+' '+esc(cat(UI.fCat).n)+' ×</button>';
  if(!a.length) return h+'<div class="vacio"><div class="ve">🗂️</div>Nada por aquí</div>';
  var ayer=new Date(Date.now()-864e5).toISOString().slice(0,10), dia=null, out='';
  a.slice(0,UI.lim).forEach(function(t){
    if(t.f!==dia){ if(dia) out+='</div>'; dia=t.f; var tot=a.filter(function(x){return x.f===dia && cat(x.cat).t==='g';}).reduce(function(s,x){return s-x.imp;},0);
      out+='<div class="dia"><div class="dh"><span>'+(dia===hoy()?'Hoy':dia===ayer?'Ayer':fechaCorta(dia))+'</span>'+(tot>0.005?'<span class="num">−'+eur(tot)+'</span>':'')+'</div>'; }
    var ct=cat(t.cat).t;
    out+='<button class="mrow" data-mov="'+t.id+'">'+av(t.cat)+'<span class="mt"><span class="mn">'+esc(nombre(t))+'</span><span class="ms">'+esc(cat(t.cat).n)+(CUENTAS.some(function(c){return c.id===t.c&&c.manual;})?' · '+esc(cuentaN(t.c)):'')+'</span></span>'+
      '<span class="num mi '+(ct==='t'?'tr':t.imp>0?'pos':'')+'">'+(t.imp>0?'+':'−')+eur(Math.abs(t.imp))+'</span></button>';
  });
  h+='<div class="card movs">'+out+'</div></div>';
  if(a.length>UI.lim) h+='<button class="btn big" data-act="mas">Ver más</button>';
  return h;
};
function movSheet(id){
  var t=S.txs.filter(function(x){return x.id===id;})[0]; if(!t) return;
  var d=$('#sheet'), tipo=cat(t.cat).t;
  var grupo=function(tp,tit){ return '<div class="small muted" style="margin:12px 0 6px">'+tit+'</div><div class="chips">'+S.cats.filter(function(c){return c.t===tp;}).map(function(c){ return '<button type="button" class="chip'+(c.id===t.cat?' on':'')+'" data-c="'+c.id+'">'+emo(c.id)+' '+esc(c.n)+'</button>'; }).join('')+'</div>'; };
  d.innerHTML='<div class="msheet"><div class="sethead"><span></span><button class="ib x" id="msNo" aria-label="Cerrar">×</button></div>'+
    '<div class="mhead">'+av(t.cat,1)+'<div class="mhn">'+esc(nombre(t))+'</div><div class="mhi num '+(t.imp>0?'pos':'')+'">'+(t.imp>0?'+':'−')+eur(Math.abs(t.imp))+'</div><div class="small muted">'+fechaCorta(t.f)+' · '+esc(cuentaN(t.c))+'</div>'+
    (t.d!==nombre(t)||t.det?'<details class="small muted" style="margin-top:6px"><summary>Detalle</summary>'+esc(t.d)+(t.det?'<br>'+esc(t.det):'')+'</details>':'')+'</div>'+
    grupo(tipo==='i'?'i':tipo==='t'?'t':'g', '¿Qué es?')+
    '<details class="small" style="margin-top:6px"><summary class="muted">Otras categorías</summary>'+(tipo!=='g'?grupo('g','Gastos'):'')+(tipo!=='i'?grupo('i','Ingresos'):'')+(tipo!=='t'?grupo('t','Traspasos (no cuentan)'):'')+'</details>'+
    (t.src==='manual'?'<button class="btn big" style="margin-top:14px" id="msEdit">Editar o borrar</button>':'')+'</div>';
  $('#msNo',d).onclick=function(){ d.close(); };
  $$('.chip[data-c]',d).forEach(function(b){ b.onclick=function(){ cambiarCat(t.id,b.dataset.c); guardar(); d.close(); render(); }; });
  if($('#msEdit',d)) $('#msEdit',d).onclick=function(){ d.close(); dlgMov(t.id); };
  d.showModal();
}

/* ---------- Presupuesto ---------- */
VISTA.presupuesto=function(){
  var ym=UI.mes, g=gastoPorCat(ym), pre=presupuestoTotal(), tot=totalGasto(ym), libre=r2(S.income-pre);
  var h=titulo('Presupuesto')+mesNav();
  h+='<div class="card hero sm"><div class="hrow"><div><div class="rl">Gastado</div><div class="rv num">'+eur0(tot)+'<span class="muted"> / '+eur0(pre)+'</span></div></div>'+
    '<button class="hchip btnchip" data-act="iniIncome">💼 Sueldo '+(S.income?eur0(S.income):'—')+'</button></div>'+barra(tot,pre).replace('class="bar','class="bar big')+
    (S.income&&pre?'<div class="small" style="margin-top:8px;color:var(--'+(libre>=0?'good':'bad')+')">'+(libre>=0?'🌱 Te sobran '+eur0(libre)+' para ahorrar':'⚠️ Presupuestas '+eur0(-libre)+' más de lo que ganas')+'</div>':'')+'</div>';
  var cats=S.cats.filter(function(c){return c.t==='g';}), act=cats.filter(function(c){return (+S.budget[c.id]||0)>0 || (g[c.id]||0)>0.005;}), resto=cats.filter(function(c){return act.indexOf(c)<0;});
  var fila=function(c){ var v=g[c.id]||0, lim=+S.budget[c.id]||0;
    return '<div class="brow">'+av(c.id)+'<div class="bm"><div class="bn"><span>'+esc(c.n)+'</span><span class="num muted"><b class="'+(lim&&v>lim?'over':'')+'">'+eur0(v)+'</b> / </span></div>'+barra(v,lim)+'</div>'+
      '<input type="text" inputmode="numeric" class="lim" data-bud="'+c.id+'" value="'+(lim||'')+'" placeholder="—" aria-label="Límite de '+esc(c.n)+'"></div>'; };
  h+='<div class="card">'+(act.length?act.map(fila).join(''):'<div class="vacio"><div class="ve">🎯</div>Escribe un límite en cada categoría</div>')+
    (resto.length?'<details class="mascat"><summary>＋ Más categorías</summary>'+resto.map(fila).join('')+'</details>':'')+'</div>';
  return h;
};

/* ---------- Deudas ---------- */
VISTA.deudas=function(){
  var t=deudaTarjeta(), h=titulo('Deudas','<button class="ib" data-act="nuevaDeuda" aria-label="Añadir deuda">＋</button>');
  h+='<div class="card hero sm"><div class="rl">Debes en total</div><div class="rv num">'+eur0(deudaTotal())+'</div></div>';
  h+='<div class="card lista">';
  if(t) h+='<div class="lrow"><span class="le">💳</span><span class="lt"><b>Tarjeta Revolut</b><span class="small muted">Estimado'+(S.card&&S.card.limite?' · límite '+eur0(S.card.limite):'')+'</span></span><span class="num lv">'+eur(t.deuda)+'</span></div>';
  if(S.card && S.card.plazos) S.card.plazos.forEach(function(p){ h+='<div class="lrow sub"><span class="le">🧾</span><span class="lt"><b>'+esc(tc(p.desc))+'</b><span class="small muted">Plazo '+esc(p.progreso)+' · '+eur(p.cuota)+'/mes</span></span><span class="num lv">'+eur(p.restante||0)+'</span></div>'; });
  S.debts.forEach(function(d){ h+='<button class="lrow" data-act="editDeuda" data-id="'+d.id+'"><span class="le">🧾</span><span class="lt"><b>'+esc(d.n)+'</b><span class="small muted">'+(d.fin?'Hasta '+mesCorto(d.fin):'')+(d.cuota?' · '+eur(d.cuota)+'/mes':'')+'</span></span><span class="num lv">'+eur(+d.pend||0)+'</span><span class="chev">›</span></button>'; });
  if(!t && !S.debts.length) h+='<div class="vacio"><div class="ve">🎉</div>Sin deudas</div>';
  return h+'</div>';
};

/* ---------- Patrimonio ---------- */
var ICUENTA={revolut:'💳',revolut_apartados:'🐷',revolut_deposito:'🏦',tr:'💶',bbva:'🏛️',efectivo:'💵',tr_cartera:'📈'};
VISTA.patrimonio=function(){
  var p=patrimonio(), h=titulo('Patrimonio');
  h+='<div class="card hero sm"><div class="rl">Neto</div><div class="rv num" style="color:var(--'+(p.neto>=0?'text':'bad')+')">'+eur0(p.neto)+'</div><div class="small muted">💰 '+eur0(p.activos)+' · 🧾 −'+eur0(p.deudas)+'</div></div>';
  h+='<div class="card lista">'+p.filas.map(function(f){
    var act = f.manual ? 'data-act="fijarSaldo" data-id="'+f.id+'"' : f.id==='tr_cartera' ? 'data-act="valorTR"' : '';
    var n=f.n.replace('Trade Republic · ','TR · ').replace('Revolut · ','');
    return '<'+(act?'button':'div')+' class="lrow" '+act+'><span class="le">'+(ICUENTA[f.id]||'💰')+'</span><span class="lt"><b>'+esc(n)+'</b>'+(f.manual?'<span class="small muted">Toca para actualizar</span>':f.est?'<span class="small muted">Estimado</span>':'')+'</span><span class="num lv">'+eur(f.v)+'</span>'+(act?'<span class="chev">›</span>':'')+'</'+(act?'button':'div')+'>'; }).join('')+
    (valorCartera()?'':'<button class="lrow" data-act="valorTR"><span class="le">📈</span><span class="lt"><b>Cartera ETF</b><span class="small muted">Toca para poner su valor</span></span><span class="lv">—</span><span class="chev">›</span></button>')+'</div>';
  h+='<div class="card"><h2>Evolución</h2>'+chartPatrimonio()+'</div>';
  return h;
};

/* ---------- Suscripciones ---------- */
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
  var h=titulo('Suscripciones','<button class="ib" data-act="nuevaSub" aria-label="Añadir suscripción">＋</button>');
  h+='<div class="card hero sm"><div class="rl">Al mes</div><div class="rv num">'+eur(tot)+'</div><div class="small muted">'+eur0(tot*12)+' al año</div></div>';
  h+='<div class="card lista">'+(S.subs.length?S.subs.map(function(s){ var u=ultimoCargo(s), viejo = u && u.f < mesSig(hoy().slice(0,7),-1)+'-01';
      return '<button class="lrow'+(s.on?'':' off')+'" data-act="editSub" data-id="'+s.id+'"><span class="le">📱</span><span class="lt"><b>'+esc(s.n)+'</b><span class="small muted">'+(!s.on?'Cancelada':u?(viejo?'⚠️ Sin cargos recientes':'Último: '+fechaCorta(u.f)):'')+'</span></span><span class="num lv">'+eur(+s.imp||0)+'</span><span class="chev">›</span></button>'; }).join('')
    :'<div class="vacio"><div class="ve">📱</div>Añade tus suscripciones con ＋</div>')+'</div>';
  var c=candidatas();
  if(c.length) h+='<h2 class="sec">🔎 ¿Estas también?</h2><div class="card lista">'+c.map(function(x,i){
    return '<div class="lrow"><span class="le">🔁</span><span class="lt"><b>'+esc(tc(x.d))+'</b><span class="small muted">'+Object.keys(x.m).length+' meses</span></span><span class="num lv">'+eur(x.imp)+'</span><button class="ib" data-act="addCand" data-i="'+i+'" aria-label="Añadir">＋</button></div>'; }).join('')+'</div>';
  return h;
};

/* ---------- Importar ---------- */
VISTA.importar=function(){
  var h=titulo('Importar');
  h+='<div class="drop" id="drop" tabindex="0" role="button"><div class="ve">'+(UI.importando?'⏳':'📄')+'</div><b>'+(UI.importando?'Leyendo…':'Elige tus PDFs')+'</b><div class="chips" style="justify-content:center;margin:12px 0 0"><span class="pill">Revolut</span><span class="pill">Tarjeta Revolut</span><span class="pill">Trade Republic</span></div><input type="file" id="fi" accept="application/pdf,.pdf" multiple hidden></div>';
  if(UI.impRes.length) h+='<div class="card lista" style="margin-top:16px">'+UI.impRes.map(function(r){
    return '<div class="lrow"><span class="le">'+(r.ok?'✅':'⚠️')+'</span><span class="lt"><b>'+esc(r.ok?r.f.tipo:r.nombre)+'</b><span class="small muted">'+(r.ok? r.f.nuevos+' nuevos'+(r.f.dup?' · '+r.f.dup+' repetidos':'') : esc(r.avisos[0]||''))+'</span>'+
      (r.ok&&r.avisos.length?'<span class="small" style="color:var(--warn)">'+esc(r.avisos[0])+'</span>':'')+'</span></div>'; }).join('')+'</div>';
  if(S.files.length) h+='<h2 class="sec">Importados</h2><div class="card lista">'+S.files.slice().reverse().map(function(f){
    return '<div class="lrow"><span class="le">🗂️</span><span class="lt"><b>'+esc(f.tipo.replace('Trade Republic','TR'))+'</b><span class="small muted">'+(f.desde?fechaCorta(f.desde)+(f.hasta&&f.hasta!==f.desde?' – '+fechaCorta(f.hasta):''):'')+' · '+f.nuevos+' mov.</span></span><button class="ib" data-act="delFile" data-id="'+f.id+'" aria-label="Quitar">🗑️</button></div>'; }).join('')+'</div>';
  return h;
};
POST.importar=function(m){
  var d=$('#drop',m), fi=$('#fi',m);
  d.onclick=function(){fi.click();}; d.onkeydown=function(e){ if(e.key==='Enter'||e.key===' '){e.preventDefault();fi.click();} };
  fi.onchange=function(){ if(fi.files.length) importar(Array.prototype.slice.call(fi.files)); };
  d.ondragover=function(e){e.preventDefault();d.classList.add('over');}; d.ondragleave=function(){d.classList.remove('over');};
  d.ondrop=function(e){e.preventDefault();d.classList.remove('over'); if(e.dataTransfer.files.length) importar(Array.prototype.slice.call(e.dataTransfer.files));};
};

/* ---------- Ajustes ---------- */
VISTA.ajustes=function(){
  var rk=Object.keys(S.rules).sort(), dias = S.lastBackup ? Math.round((new Date(hoy())-new Date(S.lastBackup))/864e5) : null;
  var h=titulo('Ajustes');
  h+='<div class="card"><div class="ah"><span class="le">🔄</span><b>Sincronizar con '+(ES_IOS?'el ordenador':'el iPhone')+'</b><span class="small muted">'+haceSync()+'</span></div>'+
    '<div class="row" style="margin-top:12px"><button class="btn pri" data-act="sync">Sincronizar</button>'+(FS_OK?'<button class="btn" data-act="syncCambiar">Elegir otro archivo</button>':'<button class="btn" data-act="syncGuardar">Crear archivo</button>')+'</div>'+
    '<p class="small muted" style="margin:10px 0 0">☁️ Usa un archivo cifrado en iCloud Drive. Se juntan los datos de los dos sin perder ni duplicar nada.</p></div>';
  h+='<div class="card"><div class="ah"><span class="le">💾</span><b>Copia de seguridad</b><span class="small '+(dias===null||dias>35?'warnt':'muted')+'">'+(dias===null?'Nunca':'Hace '+dias+' días')+'</span></div>'+
    '<div class="row" style="margin-top:12px"><button class="btn pri" data-act="exportar">Guardar copia</button><button class="btn" data-act="restaurar">Restaurar</button></div></div>';
  h+='<details class="card ad"><summary><span class="le">🏛️</span><b>Fijos de BBVA</b></summary><div class="tablewrap" style="margin-top:12px"><table><tbody>'+S.plantilla.map(function(p,i){
      return '<tr><td><input type="text" data-pl="'+i+'" data-k="d" value="'+esc(p.d)+'" placeholder="Concepto"></td><td style="width:96px"><input type="number" step="0.01" data-pl="'+i+'" data-k="imp" value="'+p.imp+'"></td><td style="width:60px"><input type="number" min="1" max="31" data-pl="'+i+'" data-k="dia" value="'+p.dia+'" aria-label="Día"></td><td><select data-pl="'+i+'" data-k="cat">'+catOpts(p.cat)+'</select></td><td><button class="ib" data-act="delPl" data-i="'+i+'" aria-label="Quitar">🗑️</button></td></tr>'; }).join('')+'</tbody></table></div>'+
    '<div class="row" style="margin-top:10px"><button class="btn" data-act="addPl">＋ Fila</button><span style="flex:1"></span><input type="month" id="plMes" value="'+hoy().slice(0,7)+'"><button class="btn pri" data-act="aplicarPl">Añadir al mes</button></div><p class="small muted" style="margin:8px 0 0">Gastos en negativo.</p></details>';
  h+='<div class="card"><div class="ah"><span class="le">📅</span><b>Mi mes empieza el día</b><input type="number" min="1" max="28" data-num="diaInicio" value="'+diaIni()+'" style="width:64px;margin-left:auto"></div></div>';
  h+='<details class="card ad"><summary><span class="le">🏷️</span><b>Categorías y fugas</b></summary><div class="chips" style="margin-top:12px">'+S.cats.filter(function(c){return c.t==='g';}).map(function(c){return '<label class="chip'+(c.fuga?' on':'')+'"><input type="checkbox" data-fuga="'+c.id+'"'+(c.fuga?' checked':'')+' hidden> '+emo(c.id)+' '+esc(c.n)+'</label>';}).join('')+'</div><p class="small muted" style="margin:4px 0 12px">Marcadas = vigiladas como fuga.</p>'+
    '<div class="row"><input type="text" id="ncN" placeholder="Nueva categoría"><select id="ncT"><option value="g">Gasto</option><option value="i">Ingreso</option><option value="t">Traspaso</option></select><button class="btn" data-act="addCat">Añadir</button></div></details>';
  h+='<details class="card ad"><summary><span class="le">🧠</span><b>Lo que ha aprendido</b><span class="small muted" style="margin-left:auto">'+rk.length+'</span></summary>'+(rk.length? '<div class="lista" style="margin-top:8px;max-height:320px;overflow:auto">'+rk.map(function(k){return '<div class="lrow"><span class="le">'+emo(S.rules[k])+'</span><span class="lt"><b>'+esc(k)+'</b><span class="small muted">'+esc(cat(S.rules[k]).n)+'</span></span><button class="ib" data-act="delRule" data-k="'+esc(k)+'" aria-label="Olvidar">✕</button></div>';}).join('')+'</div>' : '<p class="muted small" style="margin:10px 0 0">Aún nada.</p>')+'</details>';
  h+='<details class="card ad"><summary><span class="le">🔑</span><b>Cambiar contraseña</b></summary><div class="row" style="margin-top:12px"><input type="password" id="np1" placeholder="Nueva" autocomplete="new-password"><input type="password" id="np2" placeholder="Repítela" autocomplete="new-password"><button class="btn" data-act="cambiarPass">Cambiar</button></div></details>';
  h+='<p class="small muted" style="text-align:center;margin-top:18px">🔐 Tus datos van cifrados y solo salen de aquí cuando tú sincronizas.</p>';
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
function chartPatrimonio(compacto){
  var ms=meses().slice(-18), d=[]; ms.forEach(function(m){ var f=rango(m).fin; if(f>hoy()) f=hoy(); var v=activosA(f); if(v!=null) d.push({m:m,v:v}); });
  if(d.length<2) return '<div class="empty">Hace falta más de un mes de datos para dibujar la evolución.</div>';
  var mn=Math.min(0,Math.min.apply(null,d.map(function(x){return x.v;}))), mx=escala(Math.max.apply(null,d.map(function(x){return x.v;}))); if(mn<0) mn=-escala(-mn);
  var movil=window.innerWidth<720||!!compacto, W=movil?460:1080,H=movil?220:200,L=50,B=22,T=10, pw=(W-L-10)/(d.length-1), y=function(v){return T+(H-T-B)*(1-(v-mn)/(mx-mn));}, x=function(k){return L+pw*k;};
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

/* ---------- dialogos ---------- */
function dialogo(titulo, campos, botones, onOk, onDel){
  var d=$('#dlg');
  d.innerHTML='<form method="dialog"><h2>'+titulo+'</h2><div class="grid g2">'+campos+'</div><div class="row between"><div>'+(onDel?'<button type="button" class="btn danger" id="dDel">Eliminar</button>':'')+'</div><div class="row"><button type="button" class="btn" id="dNo">Cancelar</button><button class="btn pri" id="dOk">'+(botones||'Guardar')+'</button></div></div></form>';
  $('#dNo',d).onclick=function(){d.close();};
  if(onDel) $('#dDel',d).onclick=function(){ onDel(); d.close(); guardar(); render(); };
  $('form',d).onsubmit=function(e){ e.preventDefault(); var v={}; $$('[name]',d).forEach(function(el){ v[el.name]= el.type==='checkbox'? el.checked : el.value; }); if(onOk(v)!==false){ if(titulo.indexOf('movimiento')<0) S.ajTs=Date.now(); d.close(); guardar(); render(); } };
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
      else { t.f=v.f; t.c=v.c; t.d=v.d.trim(); t.imp=imp; t.cat=v.cat; t.man=1; tocar(t); }
    }, t.nuevo?null:function(){ borrado(t); S.txs=S.txs.filter(function(x){return x.id!==id;}); });
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
  dialogo((ICUENTA[id]||'💰')+' Saldo de '+cuentaN(id), fld('Saldo real (€)','<input type="number" step="0.01" name="v" value="'+(saldoCuenta(id)||0)+'" required>')+fld('A fecha','<input type="date" name="f" value="'+hoy()+'" required>')+
    '',
    null, function(v){ S.manual[id]={base:toNum(v.v), fecha:v.f, set:1}; });
}
function dlgSueldo(){
  dialogo('💼 ¿Cuánto cobras al mes?', fld('Sueldo neto (€)','<input type="text" inputmode="decimal" name="v" value="'+(S.income||'')+'" placeholder="1500" required>',1), null,
    function(v){ var n=toNum(v.v); if(!(n>0)){ toast('Escribe un importe.'); return false; } S.income=r2(n); });
  setTimeout(function(){ var i=$('#dlg [name=v]'); if(i) i.focus(); },60);
}
function dlgTR(){
  var vc=valorCartera();
  dialogo('📈 Valor de tu cartera', fld('Valor actual (€)','<input type="number" step="0.01" min="0" name="v" value="'+(vc?vc.v:'')+'" required>')+fld('A fecha','<input type="date" name="f" value="'+hoy()+'" required>'),
    null, function(v){ S.trSnaps=S.trSnaps.filter(function(s){return s.f!==v.f;}); S.trSnaps.push({f:v.f, v:toNum(v.v), src:'manual'}); });
}

/* ---------- alta rápida (botón +) ---------- */
function topCats(tipo){
  var n={}, lim=new Date(Date.now()-120*864e5).toISOString().slice(0,10);
  S.txs.forEach(function(t){ if(t.f>=lim && cat(t.cat).t===tipo) n[t.cat]=(n[t.cat]||0)+1; });
  var base = tipo==='g' ? ['super','restaurantes','transporte','compras','ocio','salud','uber','delivery'] : ['nomina','otros_ing','intereses'];
  var orden = Object.keys(n).sort(function(a,b){return n[b]-n[a];}).filter(function(k){return k!=='otros'&&k!=='alquiler'&&k!=='personas';});
  base.forEach(function(k){ if(orden.indexOf(k)<0) orden.push(k); });
  return orden.filter(function(k){ return S.cats.some(function(c){return c.id===k && c.t===tipo;}); }).slice(0, tipo==='g'?8:3);
}
function rapido(tipo0, sel0){
  var d=$('#sheet'), tipo=tipo0||'g', sel=sel0||null;
  function pintar(){
    var cs=topCats(tipo);
    if(sel && cat(sel).t!==tipo) sel=null;
    if(sel && cs.indexOf(sel)<0) cs=[sel].concat(cs.slice(0,cs.length-1));
    d.innerHTML='<form method="dialog" class="rq"><div class="sethead"><div class="seg">'+
      '<button type="button" data-t="g" class="'+(tipo==='g'?'on':'')+'">💸 Gasto</button><button type="button" data-t="i" class="'+(tipo==='i'?'on':'')+'">💰 Ingreso</button></div><button type="button" class="ib x" id="rqNo" aria-label="Cerrar">×</button></div>'+
      '<div class="amt"><input type="text" inputmode="decimal" id="rqImp" placeholder="0" autocomplete="off" aria-label="Importe"><span>€</span></div>'+
      '<div class="qcats">'+cs.map(function(k){ return '<button type="button" class="qc'+(sel===k?' on':'')+'" data-c="'+k+'" style="--c:'+col(k)+'"><span class="qe">'+emo(k)+'</span><span class="qn">'+esc(cat(k).n)+'</span></button>'; }).join('')+
      '<label class="qc'+(sel&&cs.indexOf(sel)<0?' on':'')+'"><span class="qe">⋯</span><span class="qn">Otra</span><select id="rqCat" aria-label="Otra categoría"><option value="">Otra…</option>'+S.cats.filter(function(c){return c.t===tipo;}).map(function(c){return '<option value="'+c.id+'"'+(sel===c.id&&cs.indexOf(sel)<0?' selected':'')+'>'+emo(c.id)+' '+esc(c.n)+'</option>';}).join('')+'</select></label></div>'+
      '<details class="mas-op"><summary>Nota, cuenta o fecha</summary><div class="grid g2" style="margin-top:10px">'+
        fld('Nota','<input type="text" id="rqDesc" placeholder="Opcional">',1)+
        fld('Cuenta','<select id="rqCta">'+CUENTAS.filter(function(c){return !c.deuda;}).map(function(c){return '<option value="'+c.id+'"'+(c.id===(S.lastCuenta||'bbva')?' selected':'')+'>'+esc(c.n)+'</option>';}).join('')+'</select>')+
        fld('Fecha','<input type="date" id="rqF" value="'+hoy()+'">')+
      '</div></details>'+
      '<button class="btn pri big" id="rqOk">Guardar</button>'+
      '<button type="button" class="link small" style="display:block;margin:12px auto 0" data-act="pickPDF">📄 O importa un extracto PDF</button></form>';
    $('#rqNo',d).onclick=function(){ d.close(); };
    $$('.seg button',d).forEach(function(b){ b.onclick=function(){ var v=$('#rqImp',d).value; tipo=b.dataset.t; pintar(); $('#rqImp',d).value=v; }; });
    $$('.qc[data-c]',d).forEach(function(b){ b.onclick=function(){ sel=b.dataset.c; $$('.qc',d).forEach(function(x){x.classList.toggle('on', x===b);}); $('#rqCat',d).value=''; }; });
    $('#rqCat',d).onchange=function(e){ if(e.target.value){ sel=e.target.value; $$('.qc',d).forEach(function(x){x.classList.remove('on');}); e.target.parentNode.classList.add('on'); } };
    $('form',d).onsubmit=function(e){ e.preventDefault();
      var imp=r2(toNum($('#rqImp',d).value)); if(!(imp>0)){ toast('Escribe el importe.'); $('#rqImp',d).focus(); return; }
      if(!sel){ toast('Toca una categoría.'); return; }
      var f=$('#rqF',d).value||hoy(), c=$('#rqCta',d).value||'bbva', desc=($('#rqDesc',d).value||'').trim()||cat(sel).n;
      S.lastCuenta=c;
      S.txs.push({id:S.nextId++, f:f, c:c, d:desc, det:'Añadido a mano', imp: tipo==='g'?-imp:imp, sal:null, cat:sel, man:1, src:'manual', ord:f+'|m|'+S.nextId});
      d.close(); guardar(); UI.mes=mesDe(f); render(); toast(emo(sel)+' '+(tipo==='g'?'−':'+')+eur(imp)+' guardado');
    };
  }
  pintar(); d.showModal(); setTimeout(function(){ var i=$('#rqImp',d); if(i) i.focus(); }, 60);
}
function elegirPDF(){
  var fi=$('#fiG'); fi.value='';
  fi.onchange=function(){ if(fi.files.length){ var fs=Array.prototype.slice.call(fi.files); var sh=$('#sheet'); if(sh.open) sh.close(); UI.vista='importar'; importar(fs); window.scrollTo(0,0); } };
  fi.click();
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
  var el=e.target.closest('[data-v],[data-act],[data-go-cat],[data-set-mes],[data-mov]'); if(!el) return;
  if(el.dataset.mov){ movSheet(+el.dataset.mov); return; }
  if(el.dataset.v){ UI.vista=el.dataset.v; UI.lim=150; render(); window.scrollTo(0,0); return; }
  if(el.dataset.goCat){ e.preventDefault(); UI.vista='movimientos'; UI.fCat=el.dataset.goCat; UI.fCuenta=''; UI.fTxt=''; UI.fTipo=''; UI.buscar=false; UI.fMes=''; render(); window.scrollTo(0,0); return; }
  if(el.dataset.setMes){ UI.mes=el.dataset.setMes; render(); return; }
  var a=el.dataset.act, id=+el.dataset.id;
  if({ocultarSetup:1,addPl:1,delPl:1,addCat:1,delRule:1}[a]) S.ajTs=Date.now();
  if(a==='sync'){ sincronizar(); return; }
  if(a==='syncCambiar'){ syncPC(true); return; }
  if(a==='syncGuardar'){ compartirSync(); return; }
  if(a==='rapido') rapido();
  else if(a==='pickPDF') elegirPDF();
  else if(a==='allAl'){ UI.allAl=!UI.allAl; render(); }
  else if(a==='allCat'){ UI.allCat=!UI.allCat; render(); }
  else if(a==='ocultarSetup'){ S.setupHecho=1; guardar(); render(); }
  else if(a==='iniIncome') dlgSueldo();
  else if(a==='rapidoIng') rapido('i','nomina');
  else if(a==='buscar'){ UI.buscar=!UI.buscar; if(!UI.buscar) UI.fTxt=''; render(); if(UI.buscar){ var bi=$('.buscar'); if(bi) bi.focus(); } }
  else if(a==='fTipo'){ UI.fTipo=el.dataset.t; render(); }
  else if(a==='quitarCat'){ UI.fCat=''; render(); }
  else if(a==='mes'){ UI.mes=mesSig(UI.mes,+el.dataset.d); UI.fMes=''; render(); }
  else if(a==='mas'){ UI.lim+=300; render(); }
  else if(a==='bloquear'){ location.reload(); }
  else if(a==='nuevoMov') dlgMov(); else if(a==='editMov') dlgMov(id);
  else if(a==='nuevaDeuda') dlgDeuda(); else if(a==='editDeuda') dlgDeuda(id);
  else if(a==='nuevaSub') dlgSub(); else if(a==='editSub') dlgSub(id);
  else if(a==='addCand'){ var c=candidatas()[+el.dataset.i]; if(c) dlgSub(null,{n:c.d, imp:c.imp, match:c.d.toLowerCase(), exact:0}); }
  else if(a==='fijarSaldo') dlgSaldo(el.dataset.id); else if(a==='valorTR') dlgTR();
  else if(a==='delFile'){ var f=S.files.filter(function(x){return x.id===el.dataset.id;})[0]; if(f && confirm('¿Quitar «'+f.nombre+'» y los '+f.nuevos+' movimientos que trajo?')){ borrarFichero(f.id); guardar(); render(); } }
  else if(a==='exportar') exportar();
  else if(a==='restaurar'){ var fr=$('#frG'); fr.value=''; fr.onchange=function(){ if(fr.files[0]) restaurar(fr.files[0]); }; fr.click(); }
  else if(a==='delRule'){ delete S.rules[el.dataset.k]; guardar(); render(); }
  else if(a==='addPl'){ S.plantilla.push({d:'',imp:0,cat:'otros',dia:1}); guardar(); render(); }
  else if(a==='delPl'){ S.plantilla.splice(+el.dataset.i,1); guardar(); render(); }
  else if(a==='aplicarPl'){ var ym=$('#plMes').value; if(!ym) return; var tag='plantilla:'+ym;
    if(S.txs.some(function(t){return t.tag===tag;}) && !confirm('Ya añadiste la plantilla en '+mesLargo(ym)+'. ¿Añadirla otra vez?')) return;
    var n=0, ult=+finDeMes(ym).slice(8,10); S.plantilla.forEach(function(p){ if(!p.d||!p.imp) return; var f=ym+'-'+p2(Math.min(ult,Math.max(1,+p.dia||1)));
      S.txs.push({id:S.nextId++, f:f, c:'bbva', d:p.d, det:'Plantilla mensual BBVA', imp:r2(+p.imp), sal:null, cat:p.cat, man:1, src:'manual', tag:tag, ord:f+'|m|'+S.nextId}); n++; });
    guardar(); toast(n+' movimientos añadidos a BBVA en '+mesLargo(ym)+'.'); render(); }
  else if(a==='addCat'){ var nn=$('#ncN').value.trim(); if(!nn) return; var cid='c'+(S.nextId++); S.cats.push({id:cid,n:nn,t:$('#ncT').value,fuga:0}); if($('#ncT').value==='g') S.budget[cid]=0; guardar(); render(); }
  else if(a==='cambiarPass'){ var p1=$('#np1').value, pp=$('#np2').value; if(p1.length<6){ toast('Mínimo 6 caracteres.'); return; } if(p1!==pp){ toast('Las contraseñas no coinciden.'); return; }
    (async function(){ SALT=crypto.getRandomValues(new Uint8Array(16)); KEY=await derivar(p1,SALT); await guardar(); toast('Contraseña cambiada.'); render(); })(); }
});
document.addEventListener('change', function(e){
  var el=e.target, d=el.dataset;
  if(d.bud||d.num||d.pl!==undefined||d.fuga) S.ajTs=Date.now();
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
