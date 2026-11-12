// Genera dos versiones:
//   dist/MisFinanzas/      versión de escritorio para Windows (incluye src/perfil.js si existe)
//   web/                   versión web instalable (PWA) para iPhone, sin datos personales
const fs=require('fs'), crypto=require('crypto');
const r=f=>fs.readFileSync(f,'utf8');
const safe=s=>s.replace(/<\/script/gi,'<\\/script');
const WEB_OUT=process.argv[2]||'web';
function pagina(web){
  const csp = web
    ? "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self' data: blob:; manifest-src 'self'; worker-src 'self'; connect-src 'none'; font-src data:; form-action 'none'; base-uri 'none'"
    : "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; connect-src 'none'; form-action 'none'; base-uri 'none'";
  const head = web
    ? `<meta name="theme-color" content="#256abf">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="Finanzas">
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<link rel="icon" href="icon-192.png">`
    : `<link rel="icon" href="data:image/png;base64,${r('src/icono.b64')}">`;
  const perfil = (!web && fs.existsSync('src/perfil.js')) ? `<script>${safe(r('src/perfil.js'))}</script>\n` : '';
  const sw = web ? `<script>if('serviceWorker' in navigator && (location.protocol==='https:'||location.hostname==='localhost')){navigator.serviceWorker.register('sw.js').catch(function(){});}</script>\n` : '';
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<meta name="referrer" content="no-referrer">
<title>Mis Finanzas</title>
${head}
<style>${r('src/app.css')}</style></head>
<body>
<div id="lock"></div>
<div id="app" style="display:none"><nav aria-label="Secciones"></nav><main></main></div>
<dialog id="dlg"></dialog><div id="tip"></div><div id="toast" role="status"></div>
<script>${safe(r('node_modules/pdfjs-dist/build/pdf.min.js'))}</script>
<script>${safe(r('node_modules/pdfjs-dist/build/pdf.worker.min.js'))}</script>
<script>${safe(r('src/parsers.js'))}</script>
${perfil}<script>${safe(r('src/app.js'))}</script>
${sw}</body></html>`;
}
// escritorio
fs.mkdirSync('dist/MisFinanzas',{recursive:true});
fs.writeFileSync('dist/MisFinanzas/MisFinanzas.html',pagina(false));
fs.copyFileSync('src/icono.ico','dist/MisFinanzas/icono.ico');
// web
fs.mkdirSync(WEB_OUT,{recursive:true});
const html=pagina(true);
fs.writeFileSync(WEB_OUT+'/index.html',html);
for(const f of ['apple-touch-icon.png','icon-192.png','icon-512.png']) if(WEB_OUT!=='web') fs.copyFileSync('web/'+f, WEB_OUT+'/'+f);
fs.writeFileSync(WEB_OUT+'/manifest.webmanifest', JSON.stringify({
  name:'Mis Finanzas', short_name:'Finanzas', lang:'es', start_url:'./', scope:'./', display:'standalone',
  background_color:'#f4f3f0', theme_color:'#256abf',
  icons:[{src:'icon-192.png',sizes:'192x192',type:'image/png'},{src:'icon-512.png',sizes:'512x512',type:'image/png'},{src:'apple-touch-icon.png',sizes:'180x180',type:'image/png'}]
},null,2));
const ver=crypto.createHash('sha256').update(html).digest('hex').slice(0,12);
fs.writeFileSync(WEB_OUT+'/sw.js', `// Guarda la app en el dispositivo para que funcione sin conexión. No toca tus datos.
const CACHE='misfinanzas-${ver}';
const FILES=['./','index.html','manifest.webmanifest','apple-touch-icon.png','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET' || new URL(e.request.url).origin!==location.origin) return;
  e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(hit=>{
    const red=fetch(e.request).then(res=>{ if(res.ok){ const copia=res.clone(); caches.open(CACHE).then(c=>c.put(e.request,copia)); } return res; }).catch(()=>hit);
    return hit || red;
  }));
});
`);
fs.writeFileSync(WEB_OUT+'/.nojekyll','');
console.log('ok escritorio',(fs.statSync('dist/MisFinanzas/MisFinanzas.html').size/1e6).toFixed(2),'MB · web',(html.length/1e6).toFixed(2),'MB · versión',ver);
