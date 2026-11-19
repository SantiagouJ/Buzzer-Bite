# Buzzer Bite

Buzzer Bite conecta comercios con comida cerca del cierre y personas que quieren recogerla a un precio menor. El comercio publica packs sorpresa, el cliente los reserva y los retira en el horario de recogida con un código de verificación.

El repositorio tiene dos aplicaciones:

| Carpeta | Qué es |
|---|---|
| `buzzer-bite-api` | API en NestJS, PostgreSQL y JWT |
| `buzzer-bite-web` | App web en Next.js (App Router) |

Hay dos roles: `consumer` (cliente) y `merchant` (comercio). Cada cuenta entra a su propia sección.

## Qué puede hacer cada rol

**Comercio**

- Registrarse y ubicar la cocina en el mapa
- Crear, editar y retirar packs (precio original, precio con descuento, stock y horario de recogida)
- Ver órdenes y canjearlas con el código de verificación
- Ver el perfil de la tienda

**Cliente**

- Explorar packs cercanos en mapa y lista
- Guardar favoritos
- Reservar un pack y ver el código de recogida
- Consultar el perfil

## Requisitos

- Node.js 20 o superior
- PostgreSQL (la API usa el puerto `5433` por defecto)
- Un token público de [Mapbox](https://account.mapbox.com/) para los mapas del frontend
- Credenciales de almacenamiento compatible con S3 si vas a subir fotos de tiendas y packs

## API

```bash
cd buzzer-bite-api
copy .env.example .env
npm install
npm run start:dev
```

La API queda en `http://localhost:3000/api`.

Variables en `buzzer-bite-api/.env`:

| Variable | Uso |
|---|---|
| `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE` | Conexión a PostgreSQL. Por defecto: `localhost`, `5433`, base `buzzer_bite` |
| `DB_SYNC` | `true` sincroniza el esquema con TypeORM en local |
| `JWT_SECRET` | Obligatoria. Mínimo 64 caracteres. El token dura 15 minutos |
| `PORT` | Puerto de la API. Por defecto `3000` |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_ENDPOINT_URL_S3`, `AWS_REGION`, `IMAGES_BUCKET` | Subida de imágenes |

La contraseña de una cuenta debe tener entre 15 y 128 caracteres, y solo puede incluir letras, números, espacios, `_` y `-`.

El detalle de cada endpoint está en [`buzzer-bite-api/README.md`](buzzer-bite-api/README.md). En producción la base es `https://buzzer-bite.onrender.com/api`.

Pruebas:

```bash
cd buzzer-bite-api
npm test
```

## Web

La web y la API usan el puerto 3000 si no se indica otro. Levanta el frontend en otro puerto.

Crea `buzzer-bite-web/.env.local`:

```env
BUZZER_BITE_API_URL=http://localhost:3000/api
NEXT_PUBLIC_MAPBOX_TOKEN=tu_token_publico
```

`BUZZER_BITE_API_URL` solo se lee en el servidor. El token de Mapbox sí llega al navegador porque el mapa corre ahí.

```bash
cd buzzer-bite-web
npm install
npx next dev -p 3001
```

Abre `http://localhost:3001`.

### Rutas

| Ruta | Quién | Qué muestra |
|---|---|---|
| `/` | Público | Bienvenida |
| `/login`, `/register` | Público | Ingreso y alta de cliente o comercio |
| `/register/comercio/mapa` | Comercio | Ubicación de la cocina |
| `/restaurant` | Comercio | Tablero y creación de packs |
| `/restaurant/packs` | Comercio | Listado y edición de packs |
| `/restaurant/orders` | Comercio | Órdenes y canje por código |
| `/restaurant/profile` | Comercio | Perfil de la tienda |
| `/usuario/inicio` | Cliente | Inicio |
| `/usuario/explorar` | Cliente | Mapa y lista de ofertas |
| `/usuario/favoritos` | Cliente | Favoritos |
| `/usuario/perfil` | Cliente | Perfil |

La sesión vive en una cookie `httpOnly`. El comercio entra a `/restaurant` y el cliente a `/usuario/inicio`.

## Estructura

```
buzzer-bite-api/src
├── auth/        cuentas, JWT y roles
├── stores/      tiendas
├── packs/       packs de comida
├── orders/      reservas y canje
└── favorites/   favoritos del cliente

buzzer-bite-web/src
├── app/         rutas, layouts y server actions
├── components/  interfaz
├── lib/         cliente del API y roles
├── types/       respuestas del backend
└── data/        ciudades de Colombia
```
