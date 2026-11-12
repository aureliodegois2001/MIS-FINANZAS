/* Lectores de extractos. Funciones puras: reciben paginas (lineas con items {str,x,y}) y devuelven movimientos. */
var MESES = {ene:1,feb:2,mar:3,abr:4,may:5,jun:6,jul:7,ago:8,sep:9,sept:9,set:9,oct:10,nov:11,dic:12,
  enero:1,febrero:2,marzo:3,abril:4,mayo:5,junio:6,julio:7,agosto:8,septiembre:9,setiembre:9,octubre:10,noviembre:11,diciembre:12};
function itemsToLines(items){
  items = items.slice().sort(function(a,b){return a.y-b.y || a.x-b.x;});
  var lines=[];
  for(var k=0;k<items.length;k++){
    var it=items[k], last=lines[lines.length-1];
    if(last && Math.abs(last.y-it.y) < 3) last.items.push(it);
    else lines.push({y:it.y, items:[it]});
  }
  lines.forEach(function(l){ l.items.sort(function(a,b){return a.x-b.x;}); l.text = l.items.map(function(i){return i.str;}).join(' ').replace(/\s+/g,' ').trim(); });
  return lines;
}
function pad(n){return (n<10?'0':'')+n;}
function fechaES(s){ // "30 sept 2026" o "1 de octubre de 2026"
  var m = /(\d{1,2})\s+(?:de\s+)?([a-záéíóú]+)\.?\s+(?:de\s+)?(\d{4})/i.exec(s||'');
  if(!m) return null;
  var mes = MESES[m[2].toLowerCase()];
  if(!mes) return null;
  return m[3]+'-'+pad(mes)+'-'+pad(+m[1]);
}
function impEN(s){ // "€1,600.00" "-€380.35"
  var m = /^(-)?\s*[€$£]\s?(-)?([\d,]+\.\d{2})$/.exec((s||'').trim());
  if(!m) return null;
  var v = parseFloat(m[3].replace(/,/g,''));
  return (m[1]||m[2]) ? -v : v;
}
function impES(s){ // "1.600,00 €" "156,12"
  var m = /^(-)?\s*([\d.]+,\d{2})\s*(€|EUR)?$/.exec((s||'').trim());
  if(!m) return null;
  var v = parseFloat(m[2].replace(/\./g,'').replace(',','.'));
  return m[1] ? -v : v;
}
function r2(n){return Math.round(n*100)/100;}

function detectarTipo(pages){
  var t = pages.slice(0,2).map(function(p){return p.map(function(l){return l.text;}).join('\n');}).join('\n');
  if(/Estado de Cuenta de Tarjeta de Cr[eé]dito/i.test(t)) return 'revolut-tarjeta';
  if(/TRADE REPUBLIC/i.test(t) && /EXTRACTO DEL PATRIMONIO NETO/i.test(t)) return 'tr-patrimonio';
  if(/TRADE REPUBLIC/i.test(t) && /TRANSACCIONES DE CUENTA|RESUMEN DE ESTADO DE CUENTA/i.test(t)) return 'tr-cuenta';
  if(/Estado de cuenta en [A-Z0-9]{3,5}/.test(t) && /Revolut/i.test(t)) return 'revolut-cuenta';
  if(/Estado de cuenta personalizado/i.test(t)) return 'revolut-personalizado';
  return null;
}

/* ---------- Revolut: cuenta corriente + apartados + deposito, y tarjeta de credito ---------- */
function parseRevolut(pages, esTarjeta){
  var out = {tipo: esTarjeta?'revolut-tarjeta':'revolut-cuenta', txs:[], saldos:[], avisos:[], periodo:null, extra:{}};
  var moneda = esTarjeta ? 'EUR' : null, seccion = null, cols = null, cur = null, seq = 0;
  var reFecha = /^\d{1,2} [a-záéíóú]+\.? \d{4}$/i;
  function cerrar(){ if(cur){ cur.desc = cur.desc.replace(/\s+/g,' ').trim(); cur.detalle = cur.detalle.join(' · '); out.txs.push(cur); cur=null; } }
  pages.forEach(function(lines){
    cols = null; // la cabecera de columnas se repite en cada pagina
    lines.forEach(function(l){
      var t = l.text, m;
      if((m = /^Estado de cuenta en ([A-Z0-9]{3,5})$/.exec(t))){ if(m[1]!==moneda){ cerrar(); seccion=null; } moneda = m[1]; return; }
      if(/^Generado el /.test(t)){ out.extra.generado = fechaES(t); return; }
      if(moneda!=='EUR') return;
      if(/^(Pendientes desde|Revertidas entre)/.test(t)){ cerrar(); seccion='omitir'; return; }
      if(/^Transacciones de la cuenta desde/.test(t)){ cerrar(); seccion = esTarjeta?'revolut_tarjeta':'revolut'; periodo(t); return; }
      if(/^Transacciones de Apartados/.test(t)){ cerrar(); seccion='revolut_apartados'; return; }
      if(/^Transacciones de dep[oó]sito/.test(t)){ cerrar(); seccion='revolut_deposito'; return; }
      if(/^Transacciones de /.test(t)){ cerrar(); seccion='omitir'; out.avisos.push('Sección no reconocida y omitida: '+t.slice(0,60)); return; }
      if(/^(Resumen del saldo|Compras a meses|Tipos de|Resumen general)/.test(t)){ cerrar(); seccion = /^Compras a meses/.test(t)?'plazos':null; if(/^Resumen del saldo/.test(t)) seccion='resumen'; return; }
      if(seccion==='resumen'){ resumen(l); return; }
      if(seccion==='plazos'){ plazos(l); return; }
      if(esTarjeta && !seccion){ cabeceraTarjeta(l); return; }
      if(!seccion) return;
      // cabecera de columnas
      var hOut = l.items.filter(function(i){return /^(Dinero saliente|Money out)$/.test(i.str.trim());})[0];
      if(hOut){
        var hIn = l.items.filter(function(i){return /^(Dinero entrante|Money in)$/.test(i.str.trim());})[0];
        var hSal = l.items.filter(function(i){return /^(Saldo|Balance)$/.test(i.str.trim());})[0];
        var hDesc = l.items.filter(function(i){return /^(Descripción|Description)$/.test(i.str.trim());})[0];
        cols = {out:hOut.x, inn:hIn?hIn.x:hOut.x+82, sal:hSal?hSal.x:9999, desc:hDesc?hDesc.x:125};
        return;
      }
      if(!cols || seccion==='omitir') return;
      var first = l.items[0];
      if(first.x < cols.desc-20 && reFecha.test(first.str.trim())){
        cerrar();
        var fecha = fechaES(first.str), desc=[], sal=null, imp=null;
        l.items.slice(1).forEach(function(i){
          var s=i.str.trim();
          if(i.x < cols.desc-5){ return; } // fecha valor
          var v = impEN(s);
          if(v===null || i.x < cols.out-5){
            // descripcion; puede llevar pegado un importe al final ("... GOIS €6.24")
            var mm = /^(.*?)\s+(-?€[\d,]+\.\d{2})$/.exec(s);
            if(mm && i.x < cols.out){ desc.push(mm[1]); imp = {v:impEN(mm[2]), col:'out'}; }
            else desc.push(s);
            return;
          }
          if(i.x >= cols.sal-45) sal = v;
          else if(i.x >= cols.inn-8) imp = {v:v, col:'in'};
          else imp = {v:v, col:'out'};
        });
        if(!fecha || !imp){ out.avisos.push('Línea no entendida: '+t.slice(0,80)); return; }
        cur = {fecha:fecha, cuenta:seccion, desc:desc.join(' '), detalle:[], importe: r2(imp.col==='in'? imp.v : -imp.v), saldo:sal, seq:seq++, _det:false};
        return;
      }
      if(cur && Math.abs(first.x - cols.desc) < 4){
        if(cur._det || /^(Referencia:|A |De |Tarjeta:|Comisión|Tipo de cambio|Reembolso|IBAN|Fee)/.test(t)){ cur._det = true; cur.detalle.push(t); }
        else cur.desc += ' ' + t;
      }
    });
  });
  cerrar();
  out.txs.forEach(function(x){ delete x._det; });

  function periodo(t){
    var m = /desde (?:el )?(.+?) (?:al|hasta) (.+)$/.exec(t);
    if(m){ out.periodo = {desde:fechaES(m[1]), hasta:fechaES(m[2])}; }
  }
  function resumen(l){
    var nombre = l.items[0].str.trim();
    var nums = l.items.slice(1).map(function(i){return impEN(i.str);}).filter(function(v){return v!==null;});
    if(nums.length<4) return;
    var c = /^Cuenta \(Cuenta Corriente\)/.test(nombre)?'revolut': /^Apartados/.test(nombre)?'revolut_apartados': /^Dep[oó]sito/.test(nombre)?'revolut_deposito':null;
    if(c) out.saldos.push({cuenta:c, inicial:nums[0], sale:nums[1], entra:nums[2], final:nums[3]});
  }
  function cabeceraTarjeta(l){
    var t=l.text, m;
    if((m=/L[ií]mite de cr[eé]dito acordado\s+€([\d,]+)/.exec(t))) out.extra.limite = parseFloat(m[1].replace(/,/g,''));
    if(/^€[\d,]+\.\d{2}/.test(l.items[0].str) && l.items.length>=3 && out.extra.saldoExtracto===undefined){
      out.extra.saldoExtracto = impEN(l.items[0].str); out.extra.pagoMinimo = impEN(l.items[1].str); out.extra.vence = fechaES(l.items[2].str);
    }
  }
  function plazos(l){
    var f = l.items[0];
    if(f.x<60 && reFecha.test(f.str.trim())){
      var nums = l.items.slice(2).map(function(i){return impEN(i.str);}).filter(function(v){return v!==null;});
      out.extra.plazos = out.extra.plazos||[];
      out.extra.plazos.push({inicio:fechaES(f.str), desc:l.items[1].str.trim(), compra:nums[0], total:nums[1], cuota:nums[2], restante:nums[3], progreso:''});
    } else {
      var m = /(\d+\/\d+) mensualidades/.exec(l.text);
      if(m && out.extra.plazos && out.extra.plazos.length) out.extra.plazos[out.extra.plazos.length-1].progreso = m[1];
    }
  }
  // comprobacion: cada saldo debe cuadrar con el anterior
  verificarSaldos(out);
  return out;
}

function verificarSaldos(out){
  var porCuenta = {};
  out.txs.forEach(function(x){ (porCuenta[x.cuenta]=porCuenta[x.cuenta]||[]).push(x); });
  out.descuadres = 0;
  Object.keys(porCuenta).forEach(function(c){
    var a = porCuenta[c];
    for(var i=1;i<a.length;i++){
      if(a[i].saldo===null || a[i-1].saldo===null) continue;
      if(Math.abs(r2(a[i-1].saldo + a[i].importe) - a[i].saldo) > 0.011){
        // probar con el signo contrario: columna mal detectada
        if(Math.abs(r2(a[i-1].saldo - a[i].importe) - a[i].saldo) <= 0.011) a[i].importe = -a[i].importe;
        else out.descuadres++;
      }
    }
    // primer movimiento: contrastar con el saldo inicial del resumen
    var s = (out.saldos||[]).filter(function(z){return z.cuenta===c;})[0];
    if(s && a.length && a[0].saldo!==null){
      if(Math.abs(r2(s.inicial + a[0].importe) - a[0].saldo) > 0.011 && Math.abs(r2(s.inicial - a[0].importe) - a[0].saldo) <= 0.011) a[0].importe = -a[0].importe;
    }
  });
  if(out.descuadres) out.avisos.push(out.descuadres+' movimientos no cuadran con el saldo del extracto. Revísalos.');
}

/* ---------- Trade Republic: extracto de cuenta ---------- */
function parseTRCuenta(pages){
  var out = {tipo:'tr-cuenta', txs:[], saldos:[], avisos:[], periodo:null, extra:{}}, seq=0;
  pages.forEach(function(lines){
    var cols=null, fin=false;
    var items=[]; lines.forEach(function(l){ l.items.forEach(function(i){ items.push({str:i.str.trim(), x:i.x, y:l.y}); }); });
    lines.forEach(function(l){
      var m;
      if((m=/FECHA\s+(\d{1,2} \S+ \d{4}) - (\d{1,2} \S+ \d{4})/.exec(l.text))) out.periodo={desde:fechaES(m[1]), hasta:fechaES(m[2])};
      if(/^(RESUMEN DEL BALANCE|NOTAS SOBRE|CONFIRMACIÓN)/.test(l.text)) fin = l.y;
      var e = l.items.filter(function(i){return /^ENTRADA DE/.test(i.str.trim());})[0];
      var s = l.items.filter(function(i){return /^SALIDA DE/.test(i.str.trim());})[0];
      var b = l.items.filter(function(i){return /^BALANCE$/.test(i.str.trim());})[0];
      var d = l.items.filter(function(i){return /^DESCRIPCIÓN$/.test(i.str.trim());})[0];
      if(e && s && b && d){ cols={inn:e.x, out:s.x, bal:b.x, desc:d.x, y:l.y}; }
    });
    if(!cols) return;
    lines.forEach(function(l){
      if(l.y <= cols.y+8) return;
      if(fin!==false && l.y >= fin) return;
      var amts = l.items.filter(function(i){return i.x >= cols.inn-15 && impES(i.str)!==null && /€/.test(i.str);});
      if(amts.length<2) return;
      var bal = impES(amts[amts.length-1].str), a = amts[0], v = impES(a.str);
      var esEntrada = a.x < (cols.inn+cols.out)/2;
      var cerca = items.filter(function(i){return Math.abs(i.y-l.y) < 13;});
      var dm = cerca.filter(function(i){return i.x < cols.desc-70 && /^\d{1,2} [a-záéíóú]+\.?$/i.test(i.str);})[0];
      var yr = cerca.filter(function(i){return i.x < cols.desc-70 && /^\d{4}$/.test(i.str);})[0];
      var tipo = cerca.filter(function(i){return i.x >= cols.desc-65 && i.x < cols.desc-5;}).sort(function(p,q){return p.y-q.y;}).map(function(i){return i.str;}).join(' ');
      var desc = cerca.filter(function(i){return i.x >= cols.desc-5 && i.x < cols.inn-15;}).sort(function(p,q){return p.y-q.y||p.x-q.x;}).map(function(i){return i.str;}).join(' ');
      var fecha = dm && yr ? fechaES(dm.str+' '+yr.str) : null;
      if(!fecha){ out.avisos.push('Movimiento sin fecha legible: '+desc.slice(0,60)); return; }
      out.txs.push({fecha:fecha, cuenta:'tr', desc:desc.replace(/\s+/g,' ').trim(), detalle:tipo, importe:r2(esEntrada? v : -v), saldo:bal, seq:seq++});
    });
  });
  verificarSaldos(out);
  return out;
}

/* ---------- Trade Republic: extracto del patrimonio (valor de la cartera) ---------- */
function parseTRPatrimonio(pages){
  var out = {tipo:'tr-patrimonio', txs:[], saldos:[], avisos:[], periodo:null, extra:{posiciones:[]}};
  var sec=null;
  pages.forEach(function(lines){ lines.forEach(function(l){
    var t=l.text, m;
    if((m=/^a (\d{2})\.(\d{2})\.(\d{4})$/.exec(t))) out.extra.fecha = m[3]+'-'+m[2]+'-'+m[1];
    if(/^CARTERA/.test(t)) sec='cartera';
    else if(/^CUENTA DE VALORES$/.test(t)) sec='valores';
    else if(/^EFECTIVO$/.test(t)) sec='efectivo';
    var ult = l.items[l.items.length-1].str.trim();
    if(sec==='cartera'){
      if(/^Cuenta de valores/.test(t)) out.extra.valores = impES(ult);
      if(/^Efectivo/.test(t)) out.extra.efectivo = impES(ult);
      if(/^TOTAL/.test(t)) out.extra.total = impES(ult);
    }
    if(sec==='valores' && (m=/^([\d.,]+) unidades (.+)$/.exec(l.items[0].str.trim()))){
      out.extra.posiciones.push({unidades:parseFloat(m[1].replace(/\./g,'').replace(',','.')), nombre:m[2], valor:impES(ult)});
    }
  }); });
  if(out.extra.valores===undefined || !out.extra.fecha) out.avisos.push('No se pudo leer el valor de la cartera.');
  return out;
}

function parseExtracto(pages){
  var tipo = detectarTipo(pages);
  if(tipo==='revolut-cuenta') return parseRevolut(pages,false);
  if(tipo==='revolut-tarjeta') return parseRevolut(pages,true);
  if(tipo==='tr-cuenta') return parseTRCuenta(pages);
  if(tipo==='tr-patrimonio') return parseTRPatrimonio(pages);
  if(tipo==='revolut-personalizado') return {tipo:tipo, txs:[], saldos:[], avisos:['Este es el "Estado de cuenta personalizado" de Revolut (resumen fiscal). No trae movimientos: usa el "Estado de cuenta" normal en EUR.'], extra:{}};
  return {tipo:null, txs:[], saldos:[], avisos:['No reconozco este PDF. Formatos admitidos: estado de cuenta de Revolut (EUR), extracto de tarjeta de crédito Revolut, extracto de cuenta y extracto de patrimonio de Trade Republic.'], extra:{}};
}
if(typeof module!=='undefined') module.exports={itemsToLines:itemsToLines, parseExtracto:parseExtracto, fechaES:fechaES, impEN:impEN, impES:impES};
