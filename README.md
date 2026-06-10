# Volt Cards V1

Plataforma SaaS de tarjetas NFC profesionales.
Cada usuario tiene su perfil público en `cards.voltaiagents.com/{slug}`.

## Stack

- **Next.js 15** (App Router, Server Actions, Standalone output)
- **TypeScript** + **Tailwind CSS** + **shadcn-style UI primitives**
- **Prisma** + **PostgreSQL**
- **Better Auth** (email + password, sesiones en DB)
- **Cloudflare R2** (S3 compatible) para imágenes
- **QR + vCard** generados on the fly
- **Despliegue en Railway**

## Estructura

```
volt-cards/
├── prisma/
│   ├── schema.prisma     # Users, Companies, Profiles, Links, NfcCards + Better Auth tables
│   └── seed.ts           # Crea el superadmin inicial
├── src/
│   ├── app/
│   │   ├── [slug]/                  # Perfil público
│   │   │   ├── page.tsx
│   │   │   └── vcard/route.ts       # Descarga vCard
│   │   ├── api/
│   │   │   ├── auth/[...all]/       # Better Auth handler
│   │   │   ├── slug-check/          # Validación en tiempo real
│   │   │   ├── upload/              # Subida a R2
│   │   │   ├── qr/[slug]/           # QR PNG / SVG
│   │   │   └── health/              # /api/health para Railway
│   │   ├── dashboard/               # Panel usuario
│   │   ├── company/                 # Panel admin empresa
│   │   ├── admin/                   # Panel superadmin
│   │   └── login/                   # Inicio de sesión
│   ├── components/
│   │   ├── ui/                      # Button, Input, Dialog, Select, etc.
│   │   ├── templates/               # 3 templates públicos
│   │   ├── dashboard/
│   │   └── admin/
│   ├── lib/                         # prisma, auth, session, r2, vcard, utils
│   ├── server/                      # server actions (profile, admin)
│   └── middleware.ts
├── railway.json
├── nixpacks.toml
└── .env.example
```

## Roles

| Rol            | Puede                                                                                |
|----------------|--------------------------------------------------------------------------------------|
| `SUPERADMIN`   | Crear empresas, usuarios, tarjetas; editar cualquier recurso; activar/desactivar     |
| `COMPANY_ADMIN`| Ver/crear/editar/desactivar empleados de su empresa; gestionar tarjetas de su empresa |
| `USER`         | Editar su perfil, links, plantilla, imágenes                                         |

## Setup local

```bash
# 1) Dependencias
npm install

# 2) Variables
cp .env.example .env
# Editar DATABASE_URL, BETTER_AUTH_SECRET (openssl rand -base64 32), R2_*

# 3) DB
npm run db:migrate:dev      # crea las tablas
npm run db:seed             # crea el superadmin

# 4) Dev
npm run dev                 # http://localhost:3000
```

### Credenciales por defecto (seed)

| Email                        | Password         |
|------------------------------|------------------|
| `admin@voltaiagents.com`     | `ChangeMe!2026`  |

Configurables vía `SEED_SUPERADMIN_EMAIL`, `SEED_SUPERADMIN_PASSWORD`, `SEED_SUPERADMIN_NAME`.

## Variables de entorno

| Variable                    | Descripción                                                        |
|-----------------------------|--------------------------------------------------------------------|
| `DATABASE_URL`              | Postgres connection string                                         |
| `BETTER_AUTH_SECRET`        | Secreto para firmar sesiones (`openssl rand -base64 32`)           |
| `BETTER_AUTH_URL`           | URL pública (igual a `APP_URL`)                                    |
| `APP_URL`                   | URL pública de la app (server)                                     |
| `NEXT_PUBLIC_APP_URL`       | Igual a `APP_URL`, expuesto al cliente                             |
| `R2_ACCOUNT_ID`             | ID de cuenta de Cloudflare R2                                      |
| `R2_ACCESS_KEY_ID`          | Access key R2                                                      |
| `R2_SECRET_ACCESS_KEY`      | Secret key R2                                                      |
| `R2_BUCKET`                 | Nombre del bucket                                                  |
| `R2_PUBLIC_URL`             | URL pública del bucket (ej. `https://pub-xxx.r2.dev` o tu dominio) |
| `SEED_SUPERADMIN_EMAIL`     | Email del superadmin inicial                                       |
| `SEED_SUPERADMIN_PASSWORD`  | Password del superadmin inicial (≥ 8 chars)                        |
| `PORT`                      | Puerto de Next (Railway lo inyecta)                                |

## Despliegue en Railway

El `railway.json` configura:
- Build con NIXPACKS (Node 20 + openssl).
- Start: `prisma migrate deploy && prisma seed && next start`.
- Health check en `/api/health`.

Pasos (Railway CLI):

```bash
# Login (una sola vez)
railway login

# En la raíz del proyecto
railway init --name volt-cards
railway add --database postgres            # provisiona Postgres
railway variables set BETTER_AUTH_SECRET="$(openssl rand -base64 32)"
railway variables set APP_URL=https://cards.voltaiagents.com
railway variables set NEXT_PUBLIC_APP_URL=https://cards.voltaiagents.com
railway variables set BETTER_AUTH_URL=https://cards.voltaiagents.com
railway variables set R2_ACCOUNT_ID=...
railway variables set R2_ACCESS_KEY_ID=...
railway variables set R2_SECRET_ACCESS_KEY=...
railway variables set R2_BUCKET=volt-cards
railway variables set R2_PUBLIC_URL=https://pub-xxx.r2.dev
railway variables set SEED_SUPERADMIN_EMAIL=admin@voltaiagents.com
railway variables set SEED_SUPERADMIN_PASSWORD='ChangeMe!2026'

railway up                                 # primer deploy
railway domain                             # obtener URL Railway
```

Luego en Railway → Service → Settings → Networking → Custom Domain:
agregar `cards.voltaiagents.com` y Railway te dará el **target CNAME** exacto a configurar en Porkbun:

```
Tipo:  CNAME
Nombre: cards
Target: <valor exacto que dé Railway>
TTL:    600 (o el default de Porkbun)
Proxy:  No (Porkbun no proxea por defecto; dejar desactivado)
```

## NFC

La tarjeta NFC **no almacena datos personales**. Solamente codifica la URL:

```
https://cards.voltaiagents.com/{slug}
```

Toda la información (nombre, contacto, links) se obtiene desde la base de datos.
Para escribir las tarjetas usá cualquier app NFC (ej. NFC Tools) y grabales esta URL.

## Templates

| Template     | Estilo                | Pensado para                |
|--------------|-----------------------|-----------------------------|
| `MINIMAL`    | Linktree              | Personal / startup          |
| `PREMIUM`    | HiHello / Popl        | Profesionales premium       |
| `CORPORATE`  | Ejecutivo sobrio      | Empresas, equipos formales  |

## Fuera del MVP

Facturación, pagos, suscripciones, analytics, marketplace, automatizaciones, integraciones externas, dominios custom por usuario, notificaciones, CRM.
