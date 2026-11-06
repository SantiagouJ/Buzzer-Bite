# Buzzer Bite API

Base local: `http://localhost:3000/api`

Base desplegada: `https://buzzer-bite.onrender.com/api`

En Postman crea un environment y asigna `baseUrl` a una de esas dos, incluida la parte `/api`. Las rutas de este documento son `{{baseUrl}}/...`, así que no vuelvas a escribir `/api`. En cada request protegida, Authorization tipo **Bearer Token** y pega el `access_token` del usuario con el que estés probando. `GET /api`, el registro y el login no llevan token.

Hay dos roles: `consumer` y `merchant`. El token no cambia de rol; el rol sale de la cuenta. Para probar el flujo completo registra las dos, inicia sesión con cada una y cambia el token según la sección.

La contraseña debe tener entre 15 y 128 caracteres, y solo puede incluir letras, números, espacios, `_` y `-`.

Si el cuerpo trae un `user_id` o `consumer_id` distinto al de la sesión, la API responde 403. Una orden o un favorito que no es de quien llama responde 404.

## Salud

`GET {{baseUrl}}`

Sin body. Sin token.

## 1. Merchant

`POST {{baseUrl}}/auth/register`

```json
{
  "email": "tienda@buzzerbite.com",
  "password": "clave-segura-12345",
  "full_name": "Cafe Centro",
  "phone": "3001234567",
  "role": "merchant"
}
```

`phone` y `role` son opcionales. Sin `role` la cuenta queda `consumer`. Guarda el `id`.

`POST {{baseUrl}}/auth/login`

```json
{
  "email": "tienda@buzzerbite.com",
  "password": "clave-segura-12345"
}
```

Copia `access_token` al Bearer Token. A partir de aquí las rutas de esta sección usan ese token.

`GET {{baseUrl}}/auth/me`

Sin body. La respuesta incluye `role`.

`POST {{baseUrl}}/stores`

Solo `merchant`. `user_id` tiene que ser el `id` de esta sesión. Un merchant solo puede tener una tienda.

```json
{
  "user_id": "<id del merchant>",
  "name": "Cafe Centro",
  "address": "Calle 10 #20-30",
  "latitude": 6.2442,
  "longitude": -75.5812,
  "category": "cafe"
}
```

Guarda el `id` de la tienda.

`PATCH {{baseUrl}}/stores/<store_id>`

Solo el merchant dueño. Todos los campos son opcionales.

```json
{
  "name": "Cafe Centro Actualizado",
  "address": "Calle 11 #21-40",
  "latitude": 6.25,
  "longitude": -75.58,
  "category": "bakery"
}
```

`POST {{baseUrl}}/packs`

Solo el merchant dueño de `store_id`.

```json
{
  "store_id": "<store_id>",
  "title": "Pack sorpresa",
  "description": "Pan y cafe del dia",
  "original_price": 20000,
  "discount_price": 9900,
  "stock": 5,
  "pickup_start": "16:00",
  "pickup_end": "19:00",
  "pickup_date": "2026-11-06"
}
```

`description` es opcional. Las horas van en `HH:mm` o `HH:mm:ss`. La fecha va en `YYYY-MM-DD`. El precio con descuento tiene que ser menor que el original, y `pickup_end` posterior a `pickup_start`. Guarda el `id` del pack.

`PATCH {{baseUrl}}/packs/<pack_id>`

Solo el merchant dueño de la tienda del pack. Todos los campos son opcionales. `status` puede ser `AVAILABLE`, `SOLD_OUT` o `EXPIRED`.

```json
{
  "title": "Pack sorpresa tarde",
  "description": "Incluye pastel",
  "original_price": 22000,
  "discount_price": 11000,
  "stock": 4,
  "pickup_start": "17:00",
  "pickup_end": "20:00",
  "pickup_date": "2026-11-07",
  "status": "AVAILABLE"
}
```

## 2. Consumer

Cambia el Bearer Token por el de esta cuenta. Regístrala sin `role`, o con `"role": "consumer"`.

`POST {{baseUrl}}/auth/register`

```json
{
  "email": "cliente@buzzerbite.com",
  "password": "clave-segura-12345",
  "full_name": "Santiago",
  "phone": "3007654321"
}
```

`POST {{baseUrl}}/auth/login`

```json
{
  "email": "cliente@buzzerbite.com",
  "password": "clave-segura-12345"
}
```

Pega este `access_token` en Authorization.

`GET {{baseUrl}}/stores`

`GET {{baseUrl}}/stores/nearby?latitude=6.2442&longitude=-75.5812&radius=5`

`GET {{baseUrl}}/stores/<store_id>`

`GET {{baseUrl}}/packs`

`GET {{baseUrl}}/packs/search?status=AVAILABLE&store_id=<store_id>&limit=10`

`GET {{baseUrl}}/packs/<pack_id>`

Estas lecturas también las puede hacer el merchant. `radius` es opcional y va de 0.5 a 50 km. `status` puede ser `AVAILABLE`, `SOLD_OUT` o `EXPIRED`. `limit` va de 1 a 50.

`POST {{baseUrl}}/favorites`

Solo `consumer`. `user_id` tiene que ser el `id` de esta sesión.

```json
{
  "user_id": "<id del consumer>",
  "store_id": "<store_id>"
}
```

Guarda el `id` del favorito.

`GET {{baseUrl}}/favorites`

Solo los favoritos de esta sesión.

`DELETE {{baseUrl}}/favorites/<favorite_id>`

Sin body. Responde 204. Solo si el favorito es de esta sesión.

`POST {{baseUrl}}/orders`

Solo `consumer`. `consumer_id` tiene que ser el `id` de esta sesión. `quantity` es un entero mayor o igual a 1. La orden queda en `RESERVED` y descuenta el stock del pack.

```json
{
  "consumer_id": "<id del consumer>",
  "pack_id": "<pack_id>",
  "quantity": 1
}
```

Guarda el `id` de la orden y el `verification_code`. Ese código es el que el consumer le muestra al merchant en la recogida.

`GET {{baseUrl}}/orders`

`GET {{baseUrl}}/orders/<order_id>`

El consumer solo ve sus órdenes. El merchant, con su propio token, solo ve las órdenes de los packs de su tienda. La de otro responde 404.

`PATCH {{baseUrl}}/orders/<order_id>`

Solo el consumer dueño, y solo mientras la orden está `RESERVED`. Hazlo antes de reclamar.

```json
{
  "quantity": 2
}
```

## 3. Reclamar

Vuelve a poner el Bearer Token del **merchant** dueño de la tienda. El consumer no llama esta ruta: le entrega el `verification_code` al merchant.

`PATCH {{baseUrl}}/orders/<order_id>/claim`

```json
{
  "verification_code": "<verification_code de la orden>"
}
```

Si el código coincide y la orden está `RESERVED`, pasa a `CLAIMED`. Un código incorrecto o una orden que ya no está reservada responde 409. Otro merchant responde 404.
