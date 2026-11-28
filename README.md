# Proyecto final - React JS

Q´ Comemos es una carta digital para explorar platos, armar un pedido y gestionar el catálogo desde un panel privado.

## Funcionalidades

- Catálogo por categorías, con búsqueda instantánea y paginación.
- Carrito compartido por la aplicación, con cantidades, subtotal y costos de envío.
- Inicio de sesión con correo y contraseña o con Google.
- Panel de administración protegido para crear, editar y eliminar productos.
- Persistencia del catálogo y los carritos en Firebase cuando se configura el proyecto.
- Diseño adaptable a móviles y escritorio con React-Bootstrap y CSS.
- La confirmación del pedido es una demostración: no envía la orden al local ni procesa pagos.

## Para empezar

Se necesita Node.js 20.19 o superior y npm.

```sh
npm install
npm run dev
```

La aplicación queda disponible en `http://localhost:5173/`.

## Configurar Firebase

Sin Firebase configurado, la carta usa el catálogo local de `public/productos.json` y el carrito se guarda en este navegador. Para activar el panel y la sincronización en la nube:

1. Creá un proyecto y una aplicación web en [Firebase Console](https://console.firebase.google.com/).
2. En **Authentication**, habilitá correo y contraseña, Google y acceso anónimo. Creá una base de datos de **Cloud Firestore**.
3. Copiá `.env.example` como `.env.local` y completá los valores de la aplicación web:

   ```powershell
   Copy-Item .env.example .env.local
   ```

4. Publicá las reglas de [`firestore.rules`](./firestore.rules) en Firebase.
5. Iniciá la aplicación localmente y abrí `/admin`. Registrá la cuenta administradora y verificá el correo. Si usás Google, ingresá con esa cuenta.
6. El panel muestra el UID de una cuenta que aún no tiene permisos. En Firestore, creá el documento `admins/{UID}` y agregá el campo `role` con el valor `admin`. La app no permite asignar ese rol.
7. Volvé al panel. Si la colección `products` está vacía, elegí **Importar catálogo inicial** para cargar los productos de `public/productos.json`.

Los valores `VITE_FIREBASE_*` identifican la aplicación, pero no reemplazan las reglas de acceso. No guardes contraseñas ni claves privadas en el repositorio. Si la entrega requiere usuario y contraseña de prueba, compartilos en el campo privado de la plataforma, no en este README público.

## Publicación

### Netlify

La configuración de [`netlify.toml`](./netlify.toml) define el comando de build, la carpeta `dist` y las rutas de la aplicación. En Netlify, agregá las variables `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID` y `VITE_FIREBASE_APP_ID`, y volvé a desplegar. También agregá el dominio del sitio en **Firebase Authentication → Settings → Authorized domains**.

### GitHub Pages

El proyecto conserva la ruta base necesaria para `https://elgran-as.github.io/q_comemos_pedidos/`. El workflow de [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml) publica el sitio al subir cambios a la rama principal.

## Verificaciones

```sh
npm run lint
npm run build
npm run build:netlify
```
