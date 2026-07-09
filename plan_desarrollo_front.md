# SIGEA — Plan de Desarrollo Frontend

> Basado en el estado final del backend (ajustes FP1-01 a FP1-07 y FP2-01 a FP2-07 completados).
> Árbol de funcionalidades servido por `GET /api/funcionalidades/mis-permisos`.

---

## Convenciones

- La nomenclatura de los tickets usa el prefijo **FF** (Frontend).
- Cada vista del árbol de funcionalidades corresponde a un componente/página en el frontend.
- "Mi Cuenta" es visible para **todo rol sin excepción** — no requiere permiso en `rol_funcionalidad`.
- Iconos: el backend ya no envía el campo `icono` (eliminado vía FP1-07 del plan original). El frontend mapea iconos localmente por `nombre` de funcionalidad usando clases **Bootstrap Icons** (`bi bi-*`).
- Autenticación: JWT vía `Authorization: Bearer <token>`. El login usa flujo de 2 pasos (contraseña + TOTP).
- **[DEPENDE DE]** la tarea no puede iniciarse hasta que la indicada esté terminada.
- **[BLOQUEA →]** esta tarea debe completarse antes de que otra persona pueda avanzar.

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Angular 17+ (standalone components) |
| Lenguaje | TypeScript (strict mode) |
| Routing | Angular Router con `loadComponent` lazy |
| HTTP Client | `HttpClient` + `HttpInterceptorFn` funcional (JWT automático + redirección 401) |
| UI Components | CSS puro con variables + clases BEM (`styles.css`) |
| Formularios | Template-driven (`ngModel`) |
| Estado global | Servicios singleton + Signals (`signal`, `computed`) |
| Build | Angular CLI (esbuild) |

---

## Árbol de funcionalidades

El frontend construye el menú de navegación dinámicamente desde `GET /api/api/funcionalidades/mis-permisos` (doble `/api` por context-path del backend). La respuesta tiene esta estructura:

```json
{
  "idFuncionalidad": 1,
  "nombre": "Seguridad",
  "permisos": { "ver": true, "crear": false, "editar": false, "eliminar": false, "imprimir": false },
  "hijos": [ ... ]
}
```

El frontend mapea esta respuesta a la interfaz `FuncionalidadModulo` y la almacena en `AuthService`. El sidebar se renderiza a partir de ese árbol. Cada nodo hoja con `ver=true` se muestra como un ítem navegable.

**Árbol completo (cada nodo hoja es una vista):**

```
Seguridad
├── Usuarios        → tabla CRUD
├── Roles           → tabla CRUD
├── Permisos        → matriz de checkboxes por rol
└── Mi Cuenta       → formulario (password + 2FA)
Académico
├── Aulas           → tabla CRUD
├── Alumnos         → tabla CRUD
├── Conceptos       → tabla CRUD
└── Matrícula
    └── Registrar Matrícula  → formulario
Pagos
├── Registrar Pago          → formulario
└── Historial de Deudas     → tabla con filtros
Auditoría
└── Registro de Auditoría   → tabla con filtros
Reportes
├── Reporte de Matrícula    → tabla filtrable
├── Reporte de Vacantes     → tabla
├── Reporte de Deudas       → tabla
└── Reporte de Caja         → tabla con rango de fechas
```

---

## Endpoints del backend (mapeo frontend)

> **Nota importante sobre rutas:** Algunos controllers del backend usan `@RequestMapping("/api/...")` y además existe `server.servlet.context-path: /api` en `application.yaml`. Esto produce rutas con doble `/api`. Las rutas listadas abajo son las reales probadas; el frontend debe usar estas URLs exactas.

### Autenticación

| Vista | Método | Ruta real | Request | Response |
|---|---|---|---|---|
| Login paso 1 | POST | `/api/auth/login` | `{ nombre_usuario, password }` | `{ token?, requiere2FA, mensaje }` |
| Login paso 2 | POST | `/api/auth/login/verify-2fa` | `{ idUsuario, codigoTOTP }` | `{ token, usuario, funcionalidades? }` |
| — | POST | `/api/auth/2fa/enable` | `{ password, codigoTOTP }` | `{ uriOtpAuth, secreto }` |
| — | PUT | `/api/auth/change-password` | `{ passwordActual, nuevoPassword }` | `{ mensaje }` |

### Seguridad — Usuarios

| Vista | Método | Ruta real | Request | Response |
|---|---|---|---|---|
| Tabla usuarios | GET | `/api/api/usuarios` | `Pageable` | `PageResponse<UsuarioResponse>` |
| Crear usuario | POST | `/api/api/usuarios` | `CrearUsuarioRequest` | `UsuarioResponse` |
| Editar usuario | PUT | `/api/api/usuarios/{id}` | `ActualizarUsuarioRequest` | `UsuarioResponse` |
| Eliminar usuario | DELETE | `/api/api/usuarios/{id}` | — | `204` |

### Seguridad — Roles

| Vista | Método | Ruta real | Request | Response |
|---|---|---|---|---|
| Tabla roles | GET | `/api/roles` | — | `List<RolResponse>` |
| Crear rol | POST | `/api/roles` | `RolRequest` | `RolResponse` |
| Editar rol | PUT | `/api/roles/{id}` | `RolRequest` | `RolResponse` |
| Eliminar rol | DELETE | `/api/roles/{id}` | — | `204` |

### Seguridad — Permisos

| Vista | Método | Ruta real | Request | Response |
|---|---|---|---|---|
| Asignar permisos | PUT | `/api/api/roles/{idRol}/permisos` | `PermisoRequest` | `PermisoResponse` |
| Árbol completo | GET | `/api/api/funcionalidades/tree` | — | `List<FuncionalidadTreeResponse>` |
| Mis permisos | GET | `/api/api/funcionalidades/mis-permisos` | — | `List<MisPermisosResponse>` |

### Académico — Aulas

| Vista | Método | Ruta real | Request | Response |
|---|---|---|---|---|
| Tabla aulas | GET | `/api/aulas` | `?anioAcademico&nivel` | `List<AulaBusquedaResponse>` |
| Crear aula | POST | `/api/aulas` | `AulaRequest` | `AulaResponse` |
| Eliminar aula | DELETE | `/api/aulas/{id}` | — | `204` |

### Académico — Alumnos

| Vista | Método | Ruta real | Request | Response |
|---|---|---|---|---|
| Tabla alumnos | GET | `/api/alumnos` | `?nombres` | `List<AlumnoBusquedaResponse>` |
| Crear alumno | POST | `/api/alumnos` | `AlumnoRequest` | `AlumnoResponse` |
| Eliminar alumno | DELETE | `/api/alumnos/{id}` | — | `204` |

### Académico — Conceptos

| Vista | Método | Ruta real | Request | Response |
|---|---|---|---|---|
| Tabla conceptos | GET | `/api/conceptos` | — | `List<ConceptoResponse>` |
| Crear concepto | POST | `/api/conceptos` | `ConceptoRequest` | `ConceptoResponse` |
| Editar concepto | PUT | `/api/conceptos/{id}` | `ConceptoRequest` | `ConceptoResponse` |
| Eliminar concepto | DELETE | `/api/conceptos/{id}` | — | `204` |
| Clonar conceptos | POST | `/api/conceptos/clonar` | `ClonadoRequest` | `ClonadoResponse` |

### Matrícula

| Vista | Método | Ruta real | Request | Response |
|---|---|---|---|---|
| Registrar | POST | `/api/matriculas` | `MatriculaRequest` | `MatriculaResponse` |

### Pagos

| Vista | Método | Ruta real | Request | Response |
|---|---|---|---|---|
| Registrar pago | POST | `/api/pagos` | `RegistrarPagoRequest` | `PagoResponse` |
| Deudas alumno | GET | `/api/pagos/deudas` | `?codAlumno` | `List<CuotaDeudaResponse>` |

### Reportes

| Vista | Método | Ruta real | Request | Response |
|---|---|---|---|---|
| Matrículas | GET | `/api/reportes/matriculas` | `?anioAcademico&codNivel&codGrado&codAula` | `List<MatriculaReporteResponse>` |
| Pagos / Caja | GET | `/api/reportes/pagos` | `?desde&hasta` | `PagoReporteResponse` |
| Deudas | GET | `/api/reportes/deudas` | — | `List<DeudaAlumnoResponse>` |
| Vacantes | GET | `/api/reportes/vacantes` | — | `List<VacanteReporteResponse>` |

### Parámetros

| Vista | Método | Ruta real | Request | Response |
|---|---|---|---|---|
| Obtener | GET | `/api/parametros/{clave}` | — | `String` |
| Actualizar | PUT | `/api/parametros/{clave}` | `ParametroRequest` | `String` |

---

## Tareas de desarrollo

---

### FF-01 · Integración árbol de funcionalidades + sidebar dinámico + guards

**Archivos a modificar:**

```
src/app/core/models/auth.model.ts           ← agregar funcionalidades? a LoginResponse
src/app/core/models/funcionalidad.model.ts  ← NUEVO: interfaces FuncionalidadModulo, FuncionalidadSubmodulo, FuncionalidadItem
src/app/core/services/auth.service.ts       ← agregar señal funcionalidades, métodos tieneFuncionalidad(), getMenuEntries()
src/app/core/guards/funcionalidad.guard.ts  ← NUEVO: guard que valida ruta contra el árbol
src/app/core/config/menu.config.ts          ← reestructurar como árbol con sub-grupos (fallback offline)
src/app/shared/shell/shell.component.ts     ← agregar SidebarSubGroup, actualizar tipos
src/app/shared/sidebar/sidebar.html          ← template para sub-grupos colapsables
src/app/styles.css                          ← estilos para .sidebar__subgroup-header / .sidebar__subgroup-children
src/app/app.routes.ts                       ← agregar funcionalidadGuard a cada ruta
```

**Estructura del modelo de funcionalidades:**

```typescript
// core/models/funcionalidad.model.ts
export interface FuncionalidadModulo {
  idFuncionalidad: number;
  nombre: string;             // "Seguridad"
  permisos: Permisos;
  hijos: (FuncionalidadModulo | FuncionalidadHoja)[];
}

export interface FuncionalidadHoja {
  idFuncionalidad: number;
  nombre: string;             // "Usuarios"
  ruta: string;               // "/su/usuarios"
  permisos: Permisos;
}

export interface Permisos {
  ver: boolean;
  crear: boolean;
  editar: boolean;
  eliminar: boolean;
  imprimir: boolean;
}
```

**Conversión a MenuEntry (para el sidebar):**

AuthService expone un método `getMenuEntries(): MenuEntry[]` que:
1. Si hay árbol del backend (`funcionalidades()`), lo recorre y genera `MenuEntry[]` (solo items con `ver=true`)
2. Si no hay árbol del backend, llama a `getMenuForRole(roleKey)` como fallback offline

**Sidebar — soporte 3 niveles:**

Se agrega `SidebarSubGroup` al modelo en `shell.component.ts`:
```typescript
export interface SidebarSubGroup {
  type: 'subgroup';
  group: string;
  dataGroup: string;
  icon: string;
  children: SidebarLink[];
}
```

`SidebarGroup.children` cambia a `(SidebarLink | SidebarSubGroup)[]`.

El template `sidebar.html` itera los hijos y cuando encuentra `type === 'subgroup'` renderiza un bloque colapsable anidado (mismo mecanismo `toggleGroup(dataGroup)`).

**Funcionalidad guard:**

```typescript
// core/guards/funcionalidad.guard.ts
export function funcionalidadGuard(ruta: string): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (!auth.isLoggedIn()) return router.parseUrl('/login');
    if (!auth.tieneFuncionalidad(ruta)) return router.parseUrl(auth.homeRoute);
    return true;
  };
}
```

**Iconos locales:**

El backend ya no envía `icono`. El mapping se hace en el frontend por `nombre` de funcionalidad:
```typescript
const ICON_MAP: Record<string, string> = {
  'Usuarios': 'bi bi-people',
  'Roles': 'bi bi-person-badge',
  'Permisos': 'bi bi-lock',
  'Mi Cuenta': 'bi bi-key',
  'Aulas': 'bi bi-door-open',
  'Alumnos': 'bi bi-mortarboard',
  'Conceptos': 'bi bi-receipt',
  'Registrar Matrícula': 'bi bi-file-text',
  'Registrar Pago': 'bi bi-cash',
  'Historial de Deudas': 'bi bi-clock-history',
  'Registro de Auditoría': 'bi bi-list-check',
  'Reporte de Matrícula': 'bi bi-file-text',
  'Reporte de Vacantes': 'bi bi-door-open',
  'Reporte de Deudas': 'bi bi-cash-stack',
  'Reporte de Caja': 'bi bi-cash-coin',
  // grupos
  'Seguridad': 'bi bi-shield-lock',
  'Académico': 'bi bi-book',
  'Pagos': 'bi bi-credit-card',
  'Auditoría': 'bi bi-search',
  'Reportes': 'bi bi-file-earmark-bar-graph',
  'Matrícula': 'bi bi-pencil-square',
};

export function getIcon(nombre: string): string {
  return ICON_MAP[nombre] ?? 'bi bi-circle';
}
```

**Criterios de aceptación:**

- Login recibe el árbol de funcionalidades y lo almacena en AuthService.
- Sidebar se construye desde el árbol; solo se muestran funcionalidades con `ver=true`.
- "Mi Cuenta" aparece siempre en el menú sin depender de permisos.
- Sub-grupos (ej. Matrícula) se muestran colapsables con indentación.
- Si el backend no envía árbol, se usa el fallback hardcodeado de `menu.config.ts`.
- `funcionalidadGuard` redirige a home si la ruta no está en el árbol del usuario.

---

### FF-02 · Vista Seguridad — Usuarios (CRUD)

**Archivos a modificar:**

```
src/app/features/superusuario/usuarios/
├── usuarios.component.ts     ← componente existente, conectar a API real
├── usuarios.html             ← template existente
```

> El componente `UsuariosComponent` ya existe con datos mock (`data.service.ts`). Se debe conectar a los endpoints reales del backend.

**Descripción**

Tabla paginada de usuarios con búsqueda y acciones (crear, editar, eliminar). Modal para formulario de creación/edición. Los botones de acción se muestran/ocultan según los permisos `crear`, `editar`, `eliminar` del árbol de funcionalidades para el nodo "Usuarios".

**Campos del formulario:** `nombre`, `primerApellido`, `numeroDocumento`, `nombre_usuario`, `password` (solo en creación), `rol`, `dosFactorHabilitado` (checkbox readonly en edición).

**Criterios de aceptación:**

- Tabla paginada con columnas: código, nombre, apellido, nombre_usuario, rol, estado.
- Permisos del usuario limitan acciones visibles.
- Al crear, si no se especifica password, se genera uno aleatorio.
- Los permisos (`crear`, `editar`, `eliminar`) se obtienen de `AuthService.tienePermiso('Usuarios', 'crear')`.

---

### FF-03 · Vista Seguridad — Roles (CRUD)

**Archivos a crear:**

```
src/app/features/superusuario/roles/
├── roles.component.ts
├── roles.html
src/app/core/models/rol.ts
```

**Descripción**

Tabla de roles con crear/editar/eliminar. Al eliminar, si el rol tiene usuarios asignados, el backend rechaza y se muestra el mensaje de error.

**Criterios de aceptación:**

- CRUD completo de roles.
- Botón "Asignar Permisos" que navega a la vista Permisos (`/su/permisos`).
- Al eliminar un rol con usuarios, se muestra el error del backend.

---

### FF-04 · Vista Seguridad — Permisos (matriz)

**Archivos a modificar:**

```
src/app/features/superusuario/permisos/
├── permisos.component.ts     ← existe, conectar a API real
├── permisos.html             ← template existente
```

> El componente `PermisosComponent` ya existe. Se debe conectar a los endpoints reales.

**Descripción**

Selector de rol (dropdown) + grilla de funcionalidades con checkboxes por permiso (Ver, Crear, Editar, Eliminar, Imprimir). La grilla se organiza como árbol expandible para mantener la jerarquía de funcionalidades. Se obtiene el árbol completo desde `GET /api/api/funcionalidades/tree`.

**Criterios de aceptación:**

- Al seleccionar un rol, se cargan los permisos actuales.
- Cambiar un checkbox lo envía inmediatamente al backend (PUT `/api/api/roles/{idRol}/permisos`).
- La grilla muestra la jerarquía completa del árbol de funcionalidades.
- Las funcionalidades sin ningún permiso marcado se muestran igual (el backend las guarda con todos `false` si no existen en `rol_funcionalidad`).

---

### FF-05 · Vista Seguridad — Mi Cuenta

**Archivos a modificar:**

```
src/app/features/login/change-password/
├── change-password.component.ts   ← existe, conectar a API real
├── change-password.html           ← template existente
```

> El componente `ChangePasswordComponent` ya existe. Se conecta a `PUT /api/auth/change-password` y `POST /api/auth/2fa/enable`.

**Descripción**

Formulario de cambio de contraseña (password actual + nuevo password + confirmación) y sección de activación 2FA (reverificar password + escanear QR + código TOTP para confirmar). Visible para todo rol sin excepción.

**Criterios de aceptación:**

- Cambio de password valida que el nuevo password cumpla la política (largo, caracteres).
- Activación 2FA muestra el QR para escanear con Google Authenticator.
- Se pide el código TOTP para confirmar la activación antes de persistir.
- Mensaje de éxito/error según respuesta del backend.

---

### FF-06 · Vista Académico — Aulas

**Archivos a modificar:**

```
src/app/features/aulas/
├── aulas.component.ts      ← existe, conectar a API real
├── aulas.html              ← template existente
```

> El componente `AulasComponent` ya existe. Se debe conectar a los endpoints reales.

**Descripción**

Tabla de aulas con filtros por año académico y nivel. Crear/eliminar. Al crear, mostrar campo de capacidad máxima con valor por defecto obtenido del endpoint `GET /api/parametros/VACANTES_MAXIMAS_DEFAULT`. Los botones según permisos del nodo "Aulas".

**Criterios de aceptación:**

- Filtros por año académico y nivel (dropdowns cargados desde catálogos).
- Al crear, si no se especifica capacidad, se usa el valor del parámetro.
- Al eliminar, si el aula tiene matrículas, el backend hace borrado lógico; el frontend muestra confirmación.

---

### FF-07 · Vista Académico — Alumnos

**Archivos a modificar:**

```
src/app/features/alumnos/
├── alumnos.component.ts    ← existe, conectar a API real
├── alumnos.html            ← template existente
```

> El componente `AlumnosComponent` ya existe. Se debe conectar a los endpoints reales.

**Descripción**

Tabla de alumnos con búsqueda por nombres y tipo de documento. Crear/eliminar. Los campos `numeroDocumento` y `fechaNacimiento` se cifran en el backend — el frontend los envía en texto plano y el backend los cifra.

**Criterios de aceptación:**

- Búsqueda por nombres (LIKE) y por tipo de documento.
- Al crear, `numeroDocumento` y `fechaNacimiento` se envían en texto plano.
- Validación de unicidad de (tipoDocumento, numeroDocumento) manejada desde el backend.

---

### FF-08 · Vista Académico — Conceptos

**Archivos a modificar:**

```
src/app/features/conceptos/
├── conceptos.component.ts  ← existe, conectar a API real
├── conceptos.html          ← template existente
```

> El componente `ConceptosComponent` ya existe. Se debe conectar a los endpoints reales.

**Descripción**

Tabla de conceptos del tarifario por año académico. Crear, editar, eliminar y clonar conceptos de un año a otro. Optimistic lock: al editar, si la versión cambió (otro usuario editó primero), el backend responde con error y el modal muestra la versión actualizada.

**Criterios de aceptación:**

- La tabla muestra año académico, nombre, tipo concepto, monto, orden de pago.
- Al editar, se envía la `version` actual; si cambió, se muestra mensaje y se recarga.
- Clonar: selector de año origen + año destino, con confirmación.

---

### FF-09 · Vista Matrícula — Registrar Matrícula

**Archivos a crear:**

```
src/app/features/matricula/registrar-matricula/
├── registrar-matricula.component.ts
├── registrar-matricula.html
```

**Descripción**

Formulario de registro de matrícula. El usuario debe tener 2FA habilitado (el backend lo valida). Pasos: seleccionar alumno (modal de búsqueda) → seleccionar aula (filtrada por año/nivel/grado) → mostrar resumen con conceptos y montos → confirmar.

**Criterios de aceptación:**

- Modal de búsqueda de alumno por nombre o documento (reutilizar lógica de AlumnosComponent).
- Modal de búsqueda de aula filtrada por año académico y nivel.
- Resumen muestra los conceptos activos del año académico y sus montos.
- Si el alumno ya está matriculado ese año, el backend rechaza.
- Si el aula no tiene vacantes, el backend rechaza.
- El componente usa el `ShellComponent` como layout y obtiene `menuItems` desde `AuthService`.

---

### FF-10 · Vista Pagos — Registrar Pago

**Archivos a crear:**

```
src/app/features/pagos/registrar-pago/
├── registrar-pago.component.ts
├── registrar-pago.html
```

**Descripción**

Seleccionar alumno → listar sus deudas (cuotas pendientes en orden) → seleccionar cuota a pagar → confirmar. Las cuotas deben pagarse en orden (no se puede pagar la cuota 3 si la 2 está pendiente). El backend bloquea pagos fuera de orden.

**Criterios de aceptación:**

- Las deudas se listan ordenadas por `ordenPago`.
- Si hay cuotas anteriores pendientes, la siguiente aparece bloqueada con mensaje.
- Al confirmar, se muestra el comprobante con número de recibo.

---

### FF-11 · Vista Pagos — Historial de Deudas

**Archivos a crear:**

```
src/app/features/pagos/historial-deudas/
├── historial-deudas.component.ts
├── historial-deudas.html
```

**Descripción**

Seleccionar alumno → ver todas sus cuotas (pagadas, pendientes, bloqueadas) con montos y fechas de pago.

**Criterios de aceptación:**

- Filtro por alumno.
- Estados: PENDIENTE, PAGADA, BLOQUEADA con colores distintos.
- Monto total adeudado en cabecera.

---

### FF-12 · Vista Auditoría (unificada)

**Archivos a modificar:**

```
src/app/features/auditoria/
├── auditoria.component.ts   ← existe, conectar a API real
├── auditoria.html           ← template existente
```

> El componente `AuditoriaComponent` ya existe con filtros. Se debe conectar a los endpoints reales. La vista unifica los filtros operacionales existentes con exportación CSV, eliminando la necesidad de un "Reporte de Auditoría" separado.

**Descripción**

Tabla del registro de auditoría filtrable por usuario, módulo, rango de fechas, con exportación CSV. Los campos cifrados aparecen como `***CIFRADO***`.

**Criterios de aceptación:**

- Filtros combinables: usuario (dropdown), módulo (dropdown), fecha desde/hasta.
- Las columnas `valorAnterior` y `valorNuevo` se muestran como JSON formateado.
- Los valores cifrados se ven como `***CIFRADO***`.
- Botón exportar CSV con los datos filtrados.

---

### FF-13 · Vistas Reportes

**Archivos a crear:**

```
src/app/features/reportes/reporte-matricula/
├── reporte-matricula.component.ts
├── reporte-matricula.html
src/app/features/reportes/reporte-vacantes/
├── reporte-vacantes.component.ts
├── reporte-vacantes.html
src/app/features/reportes/reporte-deudas/
├── reporte-deudas.component.ts
├── reporte-deudas.html
src/app/features/reportes/reporte-caja/
├── reporte-caja.component.ts
├── reporte-caja.html
src/app/core/models/reporte.ts
```

**Descripción**

Cuatro vistas de reporte, cada una con su tabla y filtros específicos, usando `ShellComponent` como layout. La auditoría ya tiene su vista dedicada en `/auditoria` con filtros y exportación:

| Reporte | Filtros |
|---|---|
| Matrículas | Año académico, nivel, grado, aula |
| Vacantes | Año académico, nivel (opcional) |
| Deudas | — (global, todas) |
| Caja | Rango de fechas (desde/hasta) |

**Criterios de aceptación:**

- Cada reporte muestra un total en cabecera (ej. "Total recaudado: S/ 1,200.00").
- Reportes de solo lectura, sin acciones de escritura.
- Los datos se cargan al aplicar filtros (no al montar la página).
- Cada componente obtiene `menuItems` desde `AuthService` para mantener el sidebar sincronizado.

---

## Estructura final del proyecto

```
src/app/
├── core/
│   ├── config/
│   │   └── menu.config.ts               ← fallback offline (hardcodeado)
│   ├── guards/
│   │   ├── auth.guard.ts                 ← existe
│   │   ├── role.guard.ts                 ← existe
│   │   └── funcionalidad.guard.ts        ← NUEVO
│   ├── interceptors/
│   │   └── auth.interceptor.ts           ← existe
│   ├── models/
│   │   ├── auth.model.ts                 ← modificado (funcionalidades?)
│   │   ├── funcionalidad.model.ts        ← NUEVO
│   │   ├── user.model.ts                 ← existe
│   │   ├── role.model.ts                 ← existe
│   │   ├── usuario-api.model.ts          ← existe
│   │   ├── permiso.model.ts              ← existe
│   │   ├── rol.ts                        ← NUEVO (FF-03)
│   │   └── reporte.ts                   ← NUEVO (FF-13)
│   └── services/
│       ├── auth.service.ts              ← modificado (+funcionalidades)
│       ├── data.service.ts              ← existe (mocks, se reemplazarán)
│       ├── audit.service.ts             ← existe
│       └── permisos.service.ts          ← existe
├── features/
│   ├── login/
│   │   ├── login.component.ts           ← existe
│   │   ├── verify-2fa.component.ts       ← existe
│   │   └── change-password/             ← existe
│   ├── superusuario/
│   │   ├── usuarios/                    ← existe
│   │   ├── roles/                       ← NUEVO (FF-03)
│   │   ├── permisos/                    ← existe
│   │   └── parametros/                  ← existe
│   ├── aulas/                           ← existe
│   ├── alumnos/                         ← existe
│   ├── conceptos/                       ← existe
│   ├── matricula/
│   │   ├── matricula.component.ts       ← se reemplaza por registrar-matricula/
│   │   └── registrar-matricula/         ← NUEVO (FF-09)
│   ├── pagos/
│   │   ├── pagos.component.ts           ← se reemplaza por vistas separadas
│   │   ├── registrar-pago/              ← NUEVO (FF-10)
│   │   └── historial-deudas/            ← NUEVO (FF-11)
│   ├── auditoria/                       ← existe
│   └── reportes/
│       ├── reporte-matricula/           ← NUEVO (FF-13)
│       ├── reporte-vacantes/            ← NUEVO (FF-13)
│       ├── reporte-deudas/              ← NUEVO (FF-13)
│       └── reporte-caja/                ← NUEVO (FF-13)
├── shared/
│   ├── shell/
│   │   ├── shell.component.ts           ← modificado (+SidebarSubGroup)
│   │   └── shell.component.html         ← existe
│   ├── sidebar/
│   │   ├── sidebar.component.ts         ← existe
│   │   └── sidebar.html                 ← modificado (sub-grupos)
│   └── modal/
│       ├── modal.component.ts           ← existe
│       └── modal.html                   ← existe
├── app.routes.ts                        ← modificado (+rutas + funcionalidadGuard)
├── app.config.ts                        ← existe
└── styles.css                           ← modificado (+subgrupo)
```

---

## Resumen de conteo

| Bloque | Tareas |
|---|---|
| FF-01 · Árbol dinámico + sidebar + guards | 1 |
| FF-02 a FF-05 · Seguridad (Usuarios, Roles, Permisos, Mi Cuenta) | 4 |
| FF-06 a FF-08 · Académico (Aulas, Alumnos, Conceptos) | 3 |
| FF-09 · Matrícula | 1 |
| FF-10 a FF-11 · Pagos (Registrar, Historial) | 2 |
| FF-12 · Auditoría | 1 |
| FF-13 · Reportes (4 vistas) | 1 |
| **Total** | **12** |

### Dependencias

| Tarea | Depende de |
|---|---|
| FF-01 | — |
| FF-02 | FF-01 |
| FF-03 | FF-01 |
| FF-04 | FF-03 |
| FF-05 | FF-01 |
| FF-06 | FF-01 |
| FF-07 | FF-01 |
| FF-08 | FF-01 |
| FF-09 | FF-01 |
| FF-10 | FF-01 |
| FF-11 | FF-01 |
| FF-12 | FF-01 |
| FF-13 | FF-01 |

Las tareas FF-02 a FF-13 son independientes entre sí una vez que FF-01 existe, por lo que pueden desarrollarse en paralelo.
