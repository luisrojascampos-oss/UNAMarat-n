# UNAMaratón · Performance Hub

Plataforma web fullstack para la gestión fisiológica y del rendimiento de atletas de resistencia del laboratorio **CIEMHCAVI · UNA** (Costa Rica). Evoluciona el panel original de control general a una aplicación Next.js con base de datos, API propia y diseño móvil-first.

> Principio rector del sistema: **1 atleta = 1 expediente permanente.**

## Módulos

| Módulo | Descripción |
| --- | --- |
| **Dashboard** | Panel institucional del laboratorio: KPIs (atletas totales, activos plenos, evaluaciones del mes, adherencia, competencias), distribución por especialidad y macrociclos competitivos en marcha. |
| **Atletas** | Roster completo con búsqueda y expediente individual: telemetría fisiológica (VAM, MSS, FC máx/reposo, VO2 máx), antropometría ISAK II, objetivo competitivo y vigilancia de bienestar (sueño, fatiga, DOMS, readiness, riesgo ACWR). |
| **Test 2000 m** | Captura de tests de campo con parciales de 400 m, FC media/máxima/de recuperación, escala Borg CR-10 y condiciones ambientales, con trazabilidad del evaluador y la sede. |
| **Dosificación** | Calculadora de zonas de entrenamiento (Karvonen), tiempos objetivo por distancia e intensidad (% VAM), series de control y velocidades ASR. |
| **Panel general** | Menú extendido con funciones de administración. |

Además: tema claro/oscuro, navegación inferior tipo aplicación móvil y transiciones animadas entre vistas.

## Tecnologías

- **Next.js 16** (App Router, salida standalone) · **React 19** · **TypeScript**
- **Tailwind CSS 4** con tokens Material Design 3 + componentes **shadcn/ui**
- **Prisma ORM** + **SQLite**
- **TanStack Query** (datos) · **Zustand** (estado de navegación y tema)
- **Framer Motion** (animaciones) · **Recharts** (gráficas) · **Sonner** (notificaciones)

## Estructura del proyecto

```
├── prisma/                  # Esquema y datos de la base de datos
│   ├── schema.prisma        #   Modelos: Athlete, Test2000, Macrocycle
│   └── seed.ts              #   Seed con 128 atletas de demostración
├── public/
│   ├── fonts/               # Material Symbols Outlined (autoalojado)
│   └── logo.svg
├── src/
│   ├── app/
│   │   ├── api/             # Rutas: athletes, tests, dashboard, ai-chat
│   │   ├── globals.css      # Tokens del tema claro/oscuro
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── app/             # AppShell: cabecera y navegación inferior
│   │   ├── shared/          # Avatar, iconos MS, combobox de atletas
│   │   ├── ui/              # Componentes base (shadcn/ui)
│   │   └── views/           # dashboard, athletes, detail, test, dosage, more
│   ├── hooks/               # use-mobile, use-toast
│   ├── lib/                 # db (Prisma), sports-science, types, utils
│   └── store/               # nav-store (pestañas y tema)
├── .env.example             # Plantilla de variables de entorno
├── next.config.ts
└── package.json
```

## Puesta en marcha

Requisitos: **Bun 1.x** (recomendado) o **Node.js 20+** con npm.

```bash
# 1. Instalar dependencias
bun install                 # o: npm install

# 2. Configurar variables de entorno
cp .env.example .env        # DATABASE_URL apunta a db/custom.db

# 3. Crear la base de datos y generar el cliente Prisma
bunx prisma db push         # o: npx prisma db push

# 4. Cargar datos de demostración (128 atletas)
bun run db:seed             # o: npx tsx prisma/seed.ts

# 5. Iniciar el servidor de desarrollo
bun run dev                 # o: npm run dev
```

Abre <http://localhost:3000> en tu navegador.

## Scripts disponibles

| Comando | Acción |
| --- | --- |
| `bun run dev` | Servidor de desarrollo (puerto 3000) |
| `bun run build` | Compilación para producción (standalone) |
| `bun run start` | Servidor de producción |
| `bun run lint` | Análisis con ESLint |
| `bun run db:push` | Sincroniza el esquema con la base de datos |
| `bun run db:generate` | Regenera el cliente Prisma |
| `bun run db:migrate` | Crea y aplica migraciones |
| `bun run db:reset` | Restablece la base de datos |
| `bun run db:seed` | Carga los datos de demostración |

## API

| Ruta | Descripción |
| --- | --- |
| `GET /api/dashboard` | Métricas agregadas del laboratorio |
| `GET/POST /api/athletes` | Lista y creación de atletas |
| `GET/PUT/DELETE /api/athletes/[id]` | Detalle, actualización y borrado |
| `POST /api/athletes/import` | Importación masiva de atletas |
| `GET/POST /api/tests` | Tests de 2000 m |
| `POST /api/ai-chat` | Asistente conversacional |
| `GET /api` | Comprobación de estado |

## Datos de demostración

`prisma/seed.ts` genera un roster de **128 atletas** (86 activos plenos y 42 en transición o baja) repartidos en las cuatro especialidades: Maratón (51), Medio Fondo (32), 10K/5K (26) y Trail & Salud (19), junto con sus tests 2000 m y los macrociclos competitivos. Todos los datos son ficticios y se regeneran con cada ejecución del seed.

## Notas

- El indicador «Excel Sync» de la barra superior es informativo (demostración).
- SQLite es ideal para desarrollo y uso local. Para desplegar en producción (por ejemplo en Vercel) se recomienda cambiar el `datasource` de `prisma/schema.prisma` a Postgres o Turso.
- Proyecto basado en el panel de control original «Panel de Control General».
