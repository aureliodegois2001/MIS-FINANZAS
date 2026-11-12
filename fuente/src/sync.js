/* ================= Sincronización entre dispositivos =================
   Un archivo cifrado (mis-finanzas-sync.mfin) que ambos dispositivos leen y escriben.
   Al sincronizar se JUNTAN los datos: nada se pierde ni se duplica. */
function uid(){ var a=crypto.getRandomValues(new Uint8Array(8)); return Array.prototype.map.call(a,function(x){return ('0'+x.toString(16)).slice(-2);}).join(''); }
function sellar(){ // identidad estable para cada movimiento
  if(!S.dev) S.dev=uid().slice(0,6);
  if(!S.del) S.del={};
  S.txs.forEach(function(t){ if(!t.u) t.u=uid(); if(!t.ts) t.ts=1; });
}
function tocar(t){ t.ts=Date.now(); }
function borrado(t){ if(t && t.u){ if(!S.del) S.del={}; S.del[t.u]=hoy(); } }
function claveFich(f){ return [f.tipo,f.desde||'',f.hasta||'',f.nombre||''].join('|'); }

/* Junta R (datos del otro dispositivo) dentro de S. Devuelve un resumen. */
function juntar(R){
  sellar(); var Rdel=R.del||{}, res={nuevos:0, cambiados:0, quitados:0};
  Object.keys(Rdel).forEach(function(k){ S.del[k]=S.del[k]||Rdel[k]; });
  // ficheros: mismo extracto => mismo fichero
  var mapF={}, misF={}; S.files.forEach(function(f){ misF[claveFich(f)]=f; });
  (R.files||[]).forEach(function(f){ var k=claveFich(f), m=misF[k]; if(S.del['f:'+k]){ mapF[f.id]=f.id; return; }
    if(m){ mapF[f.id]=m.id; } else { var nf=JSON.parse(JSON.stringify(f)); nf.id='f'+(S.nextId++); mapF[f.id]=nf.id; S.files.push(nf); misF[k]=nf; } });
  var srcDe=function(s){ return mapF[s]||s; };
  // movimientos
  var porU={}, porClave={}; S.txs.forEach(function(t){ porU[t.u]=t; if(t.src!=='manual'){ var k=clave(t); (porClave[k]=porClave[k]||[]).push(t); } });
  var usados={};
  (R.txs||[]).forEach(function(r){
    if(S.del[r.u]) return;
    var m=porU[r.u];
    if(!m && r.src!=='manual'){ var c=porClave[clave(r)]||[]; for(var i=0;i<c.length;i++){ if(!usados[c[i].u]){ m=c[i]; break; } } }
    if(m){ usados[m.u]=1;
      if((r.ts||1)>(m.ts||1)){ ['f','c','d','imp','cat','man','det'].forEach(function(k){ m[k]=r[k]; }); m.ts=r.ts; res.cambiados++; }
      return; }
    var n=JSON.parse(JSON.stringify(r)); n.id=S.nextId++; n.src=srcDe(r.src); S.txs.push(n); porU[n.u]=n; usados[n.u]=1; res.nuevos++;
  });
  S.files=S.files.filter(function(f){ return !S.del['f:'+claveFich(f)]; });
  var antes=S.txs.length; S.txs=S.txs.filter(function(t){ return !S.del[t.u]; }); res.quitados=antes-S.txs.length;
  // valores de cartera, reglas aprendidas
  var snaps={}; S.trSnaps.forEach(function(s){ snaps[s.f+'|'+s.v]=1; });
  (R.trSnaps||[]).forEach(function(s){ if(!snaps[s.f+'|'+s.v]){ var n=JSON.parse(JSON.stringify(s)); n.src=srcDe(s.src); S.trSnaps.push(n); } });
  var nuevo=(R.ajTs||0)>(S.ajTs||0) || (!S.ajTs && !S.income && !!R.income);
  var rr=R.rules||{}; Object.keys(rr).forEach(function(k){ if(nuevo || !S.rules[k]) S.rules[k]=rr[k]; });
  // lo aprendido en cualquiera de los dos se aplica a todos los movimientos de ese comercio
  S.txs.forEach(function(t){ if(t.man) return; var k=norm(t.d), c=k&&S.rules[k]; if(c && t.cat!==c && S.cats.some(function(x){return x.id===c;})){ t.cat=c; } });
  if(R.card && (!S.card || (R.card.fecha||'')>(S.card.fecha||''))){ S.card=JSON.parse(JSON.stringify(R.card)); if(S.card.src) S.card.src=srcDe(S.card.src); }
  // ajustes (sueldo, límites, deudas, suscripciones, saldos BBVA…): gana el más reciente
  if(nuevo){ ['income','budget','subs','debts','manual','plantilla','diaInicio','cats','setupHecho'].forEach(function(k){ if(R[k]!==undefined) S[k]=JSON.parse(JSON.stringify(R[k])); }); S.ajTs=R.ajTs; }
  return res;
}

/* ---------- archivo de sincronización ---------- */
var SYNC_NOMBRE='mis-finanzas-sync.mfin';
async function empaquetar(){ sellar(); var c=await cifrar(S); return JSON.stringify({app:'misfinanzas', v:1, sync:1, salt:b64(c.salt), iv:b64(c.iv), ct:b64(c.ct)}); }
async function abrirPaquete(txt){
  var j=JSON.parse(txt); if(j.app!=='misfinanzas') throw new Error('no');
  var salt=unb64(j.salt), blob={iv:unb64(j.iv), ct:unb64(j.ct)};
  if(b64(salt)===b64(SALT)){ try{ return {datos:await descifrar(blob,KEY)}; }catch(e){} }
  var pass=prompt('Contraseña de Mis Finanzas en el otro dispositivo:'); if(pass===null) return null;
  var k=await derivar(pass,salt), datos;
  try{ datos=await descifrar(blob,k); }catch(e){ toast('Contraseña incorrecta.'); return null; }
  return {datos:datos, k:k, salt:salt};
}
function resumenSync(r){
  var pl=function(n,a){ return n+' '+a+(n===1?'':'s'); }, p=[]; if(r.nuevos) p.push(pl(r.nuevos,'nuevo')); if(r.cambiados) p.push(pl(r.cambiados,'cambiado')); if(r.quitados) p.push(pl(r.quitados,'quitado'));
  return p.length?'Sincronizado: '+p.join(', '):'Todo estaba al día';
}
async function aplicarPaquete(txt){
  var o=await abrirPaquete(txt); if(!o) return null;
  var r=juntar(o.datos);
  // misma contraseña y clave en los dos dispositivos: las siguientes veces no la pide
  if(o.k){ KEY=o.k; SALT=o.salt; }
  S.lastSync=new Date().toISOString(); await guardar(); return r;
}

/* Ordenador (Edge/Chrome): se elige una vez el archivo dentro de iCloud Drive y luego es un toque. */
var FS_OK = typeof window.showOpenFilePicker==='function';
async function syncPC(cambiar){
  var h = cambiar ? null : await idbGet('syncHandle');
  if(!h){
    var nuevo = confirm('¿Ya tienes el archivo de sincronización en iCloud Drive?\n\nAceptar = elegirlo\nCancelar = crearlo ahora');
    try{
      if(nuevo){ var hs=await window.showOpenFilePicker({types:[{description:'Mis Finanzas',accept:{'application/octet-stream':['.mfin']}}]}); h=hs[0]; }
      else { h=await window.showSaveFilePicker({suggestedName:SYNC_NOMBRE, types:[{description:'Mis Finanzas',accept:{'application/octet-stream':['.mfin']}}]}); }
    }catch(e){ return; }
    await idbSet('syncHandle', h);
  }
  if(h.queryPermission && (await h.queryPermission({mode:'readwrite'}))!=='granted'){
    if((await h.requestPermission({mode:'readwrite'}))!=='granted'){ toast('Sin permiso para usar el archivo.'); return; }
  }
  var r={nuevos:0,cambiados:0,quitados:0}, txt=await (await h.getFile()).text();
  if(txt.trim()){ try{ r=await aplicarPaquete(txt); }catch(e){ toast('Ese archivo no es de Mis Finanzas.'); return; } if(!r) return; }
  var w=await h.createWritable(); await w.write(await empaquetar()); await w.close();
  S.lastSync=new Date().toISOString(); await guardar(); render(); toast('🔄 '+resumenSync(r));
}

/* iPhone y navegadores sin acceso a archivos: abrir el archivo, juntar y volver a guardarlo. */
function syncMovil(){
  var fi=$('#fsG'); fi.value='';
  fi.onchange=async function(){ if(!fi.files[0]) return;
    var r; try{ r=await aplicarPaquete(await fi.files[0].text()); }catch(e){ toast('Ese archivo no es de Mis Finanzas.'); return; }
    if(!r) return; render(); dlgGuardarSync(resumenSync(r)); };
  fi.click();
}
function dlgGuardarSync(msg){
  var d=$('#sheet');
  d.innerHTML='<div class="msheet"><div class="mhead"><div class="ve" style="font-size:48px">✅</div><div class="mhn">'+esc(msg)+'</div>'+
    '<p class="small muted" style="margin:6px 0 0">Último paso: guarda el archivo otra vez en iCloud Drive para que el otro dispositivo vea tus cambios. Si pregunta, elige <b>Reemplazar</b>.</p></div>'+
    '<button class="btn pri big" id="sgOk" style="margin-top:14px">☁️ Guardar en iCloud Drive</button><button class="link small" id="sgNo" style="display:block;margin:12px auto 0">Ahora no</button></div>';
  $('#sgNo',d).onclick=function(){ d.close(); };
  $('#sgOk',d).onclick=async function(){ await compartirSync(); d.close(); };
  d.showModal();
}
async function compartirSync(){
  var txt=await empaquetar();
  if(navigator.canShare){
    try{ var fl=new File([txt],SYNC_NOMBRE,{type:'application/octet-stream'}); if(navigator.canShare({files:[fl]})){ await navigator.share({files:[fl]}); S.lastSync=new Date().toISOString(); await guardar(); render(); return; } }
    catch(e){ if(e && e.name==='AbortError') return; }
  }
  var a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([txt],{type:'application/octet-stream'})); a.download=SYNC_NOMBRE; a.click(); setTimeout(function(){URL.revokeObjectURL(a.href);},5000);
  S.lastSync=new Date().toISOString(); await guardar(); render();
}
function sincronizar(){ if(FS_OK) syncPC(false); else syncMovil(); }
function haceSync(){
  if(!S.lastSync) return 'Nunca';
  var m=Math.round((Date.now()-new Date(S.lastSync))/60000);
  return m<1?'Ahora mismo': m<60?'Hace '+m+' min': m<1440?'Hace '+Math.round(m/60)+' h':'Hace '+Math.round(m/1440)+' días';
}
