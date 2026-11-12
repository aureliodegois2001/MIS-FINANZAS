const {extract}=require('./extract.js'); const {parseExtracto}=require('../src/parsers.js');
(async()=>{ for(const f of process.argv.slice(2)){ const r=parseExtracto(await extract(f));
  const by={}; r.txs.forEach(t=>{const b=by[t.cuenta]=by[t.cuenta]||{n:0,inn:0,out:0,last:null,first:t}; b.n++; if(t.importe>0)b.inn+=t.importe; else b.out-=t.importe; b.last=t;});
  console.log('\n##',f.slice(-36,-28),r.tipo,JSON.stringify(r.periodo),'avisos:',r.avisos,'\n saldos',JSON.stringify(r.saldos),'\n extra',JSON.stringify(r.extra));
  for(const c in by) console.log(' ',c,'n',by[c].n,'in',by[c].inn.toFixed(2),'out',by[c].out.toFixed(2),'ultimo saldo',by[c].last.saldo, by[c].last.fecha);
  if(process.env.DUMP) r.txs.slice(0,+process.env.DUMP).forEach(t=>console.log(JSON.stringify(t)));
}})();
