# Mis Finanzas

App personal de finanzas que funciona entera en el dispositivo: lee extractos en PDF de Revolut y Trade Republic, clasifica los gastos por categorías (y aprende de las correcciones), y muestra presupuesto, deudas, patrimonio y suscripciones.

- **Privada por diseño:** no envía nada a ningún servidor. La página bloquea cualquier conexión externa (Content-Security-Policy) y los datos se guardan cifrados con AES-256 en el propio dispositivo, protegidos por contraseña.
- **Sin conexión:** después de abrirla una vez, funciona sin internet.
- Este repositorio solo contiene el código de la app. Ningún dato financiero.

## Instalar en el iPhone

1. Abre la dirección de la app en **Safari**.
2. Pulsa **Compartir** › **Añadir a pantalla de inicio**.
3. Abre la app desde el icono, crea tu contraseña e importa tus PDFs desde Archivos.

## Desarrollo

El código está en `fuente/`. `npm install` y luego `node build.js ..` regeneran `index.html`, `sw.js` y `manifest.webmanifest` en la raíz.
