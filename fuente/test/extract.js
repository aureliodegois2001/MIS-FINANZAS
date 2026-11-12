// Extrae lineas con posiciones usando pdf.js (misma logica que la app)
const pdfjs = require('pdfjs-dist/legacy/build/pdf.js');
const fs = require('fs');
const { itemsToLines } = require('../src/parsers.js');
async function extract(path){
  const data = new Uint8Array(fs.readFileSync(path));
  const doc = await pdfjs.getDocument({data, useSystemFonts:true, verbosity:0}).promise;
  const pages=[];
  for(let p=1;p<=doc.numPages;p++){
    const page = await doc.getPage(p);
    const tc = await page.getTextContent();
    const vp = page.getViewport({scale:1});
    const items = tc.items.filter(i=>i.str && i.str.trim()).map(i=>({str:i.str, x:i.transform[4], y:vp.height - i.transform[5], w:i.width}));
    pages.push(itemsToLines(items));
  }
  return pages;
}
module.exports={extract};
if(require.main===module){
  extract(process.argv[2]).then(pages=>{
    const from=+(process.argv[3]||1), to=+(process.argv[4]||from);
    for(let p=from;p<=to;p++){ console.log('--- page',p); for(const l of pages[p-1]) console.log(l.items.map(i=>`[${Math.round(i.x)}]${i.str}`).join(' ')); }
  });
}
