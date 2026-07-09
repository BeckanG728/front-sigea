# 🎓 SIGEA — Sistema de Control de Cuentas

## 📄 Información General

| Campo | Detalle |
|---|---|
| Nombre del proyecto | SIGEA (Sistema Integrado de Gestión Educativa y Administrativa) — Sistema de Control de Cuentas |
| Tipo | Backend monolítico en capas (Spring Boot) con frontend web |
| Dominio | Gestión académica: matrícula, cuotas y pagos |
| Duración | 1 sprint (curso Criptografía 2) |
| Modalidad | Evaluación individual sobre proyecto grupal |

## 📝 Descripción del Sistema

SIGEA (Sistema Integrado de Gestión Educativa y Administrativa) es una plataforma de control de cuentas para una institución educativa. Permite administrar usuarios con roles y permisos granulares, matricular alumnos en aulas por año académico, generar cuotas a partir de un tarifario configurable, y registrar pagos — todo bajo transacciones atómicas, control de concurrencia optimista y auditoría completa de cada operación.

### Módulos del sistema

| Módulo | Responsabilidad |
|---|---|
| Seguridad | Login, cambio de contraseña, hash+salt de credenciales |
| Usuarios y roles | Gestión de usuarios, roles y permisos (Ver/Crear/Editar/Eliminar/Imprimir) por funcionalidad |
| Aulas | Registro de aulas por año académico, nivel, grado y sección |
| Alumnos | Registro de alumnos con datos sensibles cifrados (AES) |
| Conceptos (tarifario) | Definición de conceptos de pago por año académico |
| Matrícula | Registro de matrícula con validaciones y doble factor |
| Pagos | Registro de pagos y generación de recibos |
| Auditoría | Trazabilidad de toda operación sobre el sistema |
| Reportes | Reportes consultables/exportables de matrícula, pagos y auditoría |

## 🔐 Modelo de Seguridad

El sistema define tres tipos de usuario:

| Rol | Permisos |
|---|---|
| Superusuario | Acceso total. No puede eliminarse |
| Director | Solo consulta de registros |
| Secretaria | Todas las operaciones del sistema |

Los permisos no están fijados por rol en código: se resuelven dinámicamente contra la tabla `Rol_Funcionalidad`, que define por cada rol y funcionalidad qué acciones (`Ver`, `Crear`, `Editar`, `Eliminar`, `Imprimir`) están habilitadas. El árbol de funcionalidades (`Funcionalidad.padre`) alimenta el menú lateral (Tree JavaScript).

> **Seeding inicial:** solo el rol y el usuario Superusuario se crean automáticamente al arrancar la aplicación, mediante un `CommandLineRunner` idempotente (variables de entorno `SUPERUSER_USERNAME`/`SUPERUSER_PASSWORD`, nunca hardcodeadas — ver sección de Contenerización). Los roles Director y Secretaria, y su matriz de permisos por defecto sobre `Rol_Funcionalidad`, **no** se siembran en código: se configuran desde la UI de administración por el Superusuario, y quedan además como parte de la colección Postman/script de demo para no improvisarlos en la sustentación.

> **Flujo de autenticación (decisión cerrada):** el login se resuelve directamente en `AuthServiceImpl` (valida contraseña con `PasswordEncoder` y emite el JWT), **no** mediante el flujo estándar de Spring Security (`DaoAuthenticationProvider` + `AuthenticationManager` + `CustomUserDetailsService`). Dos motivos, no solo simplicidad: (1) el contrato de `DaoAuthenticationProvider` es todo-o-nada (`Authentication` completo o `AuthenticationException`) y no modela limpiamente el estado intermedio `PENDIENTE_2FA` que necesita el login en dos pasos; (2) las autorizaciones del sistema no se resuelven vía `GrantedAuthority` en ningún punto — pasan por `PermisoEvaluator` contra `Rol_Funcionalidad` (Ver/Crear/Editar/Eliminar/Imprimir por funcionalidad), así que un `CustomUserDetailsService` que mapee `Rol` a `GrantedAuthority` no aportaría nada a esa ruta. El rol viaja únicamente como claim informativo del JWT (`rol: "Secretaria"`).

### Reglas de cifrado

| Dato | Mecanismo |
|---|---|
| Contraseña de usuario | Hash + salt (`BCryptPasswordEncoder`) |
| `fechaNacimiento`, `numeroDocumento` del alumno | Cifrado AES (JPA `AttributeConverter`) |
| Segundo factor (login, no en cada matrícula) | TOTP compatible con Google Authenticator; `Usuario.totpSecret` cifrado con AES (`AttributeConverter`), nunca en texto plano |

## ⚙️ Tecnologías y Herramientas

| Categoría | Tecnología |
|---|---|
| Lenguaje | Java 21 |
| Framework | Spring Boot 4.1.0 |
| Seguridad | Spring Security + BCrypt + TOTP (Google Authenticator) |
| Cifrado de datos | AES (`javax.crypto`, `AttributeConverter` de JPA) |
| Base de datos | PostgreSQL, con réplica (streaming replication) |
| Persistencia | Spring Data JPA + Hibernate, `@Version` (optimistic lock) |
| Auditoría | Spring AOP / Hibernate Envers-like interceptor |
| Caché de aplicación | Caffeine (sesión pendiente de 2FA, permisos por rol, parámetros del sistema) |
| Documentación | Swagger UI / OpenAPI 3.0 |
| Testing | JUnit 5 + Mockito |
| Mappers | MapStruct |
| Utilidades | Lombok |
| Contenerización | Docker + Docker Compose |
| Build | Maven o Gradle |

## 📦 Estructura de Paquetes

Monolito modular, paquete base `com.institucion.sigea`. Cada módulo de negocio sigue el mismo patrón `entity/ → repository/ → service/ + service/impl/ → controller/ → dto/request|response/` (interfaz + implementación en todos los servicios, sin excepción, incluido `auth/`):

```
com.institucion.sigea
├── core/               → BaseEntity, ErrorCode, BusinessException, GlobalExceptionHandler, AesConverter
├── config/             → CacheConfig (Caffeine), CorsConfig, JpaAuditingConfig, OpenApiConfig
├── security/
│   ├── jwt/            → JwtUtil, JwtAuthFilter, JwtPrincipal
│   ├── config/          → SecurityConfig (PasswordEncoder, SecurityFilterChain)
│   └── permission/      → PermisoEvaluator (hasPermission)
├── auth/               → AuthService (login + verify-2fa), TotpService, CambioPasswordService
├── usuario/            → Usuario, Rol, Funcionalidad, RolFuncionalidad, PermisoService
├── auditoria/          → AuditoriaEntity, AuditoriaService, AuditoriaAspect, @Auditable
├── parametro/          → Parametro (config clave-valor cacheada)
├── aula/                → Aula, AnioAcademico, Nivel, Grado
├── alumno/              → Alumno, TipoDocumento
├── concepto/           → Concepto, TipoConcepto, ClonadorConceptoService
├── matricula/           → Matricula, Cuota, MatriculaValidator, MatriculaService, TwoFaClaimInterceptor
├── pago/                → Pago, Recibo, PagoService, PagoTransaccionService
└── reporte/             → ReporteService, ReporteController
```

`BaseEntity` es la superclase común (`@Version` para optimistic lock, `estado` booleano para eliminación lógica, timestamps de auditoría) — ninguna entidad nueva debe redefinir estos campos ni usar un enum de estado propio.

## ⚠️ Contrato estándar de errores

Todos los endpoints del sistema devuelven los errores con la misma forma, mapeada al siguiente record:

```java
public record ErrorResponse(
        String error,
        String message,
        Map<String, Object> metadata,
        Instant timestamp
) {
}
```

- `error`: código corto en mayúsculas (ej. `INVALID_CREDENTIALS`, `VERSION_CONFLICT`).
- `message`: descripción legible para el usuario.
- `metadata`: información contextual adicional del error (puede ser un objeto vacío `{}` si no aplica).
- `timestamp`: fecha/hora del servidor en formato ISO-8601.

## 🔑 Autenticación — Seguridad

### 1. `POST /api/auth/login`

**Acceso:** Público

**Descripción:** Valida usuario y contraseña. Si el usuario tiene 2FA habilitado, **no** devuelve el token de sesión definitivo: guarda un estado `PENDIENTE_2FA` en caché (Caffeine, TTL de 5 minutos, clave = `idUsuario`) y responde con `requiere2FA: true` para que el frontend solicite el código TOTP. Si el usuario no tiene 2FA habilitado, devuelve el token directamente.

**Body:**

```json
{
  "usuario": "jperez",
  "password": "Clave123!"
}
```

**Response 200 OK (con 2FA pendiente):**

```json
{
  "token": null,
  "requiere2FA": true,
  "idUsuario": 12,
  "rol": "Secretaria"
}
```

**Response 200 OK (sin 2FA / ya verificado):**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "idUsuario": 12,
  "rol": "Secretaria",
  "requiere2FA": false
}
```

**Response 401 Unauthorized:**

```json
{
  "error": "INVALID_CREDENTIALS",
  "message": "Usuario o contraseña incorrectos",
  "metadata": {},
  "timestamp": "2026-07-01T10:30:00Z"
}
```

**Response 429 Too Many Requests** (rate limiting, ver sección de Decisión de Arquitectura):

```json
{
  "error": "LOGIN_BLOCKED",
  "message": "Demasiados intentos fallidos. Intente nuevamente en unos minutos",
  "metadata": {
    "minutosRestantes": 7
  },
  "timestamp": "2026-07-01T10:30:00Z"
}
```

### 2. `POST /api/auth/login/verify-2fa`

**Acceso:** Público (requiere haber pasado por `POST /api/auth/login` con `requiere2FA: true` dentro de los últimos 5 minutos)

**Descripción:** Verifica el código TOTP contra el estado `PENDIENTE_2FA` guardado en Caffeine. Si es válido, borra la entrada de caché y emite el token de sesión definitivo.

**Body:**

```json
{
  "idUsuario": 12,
  "codigoTotp": "483920"
}
```

**Response 200 OK:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "idUsuario": 12,
  "rol": "Secretaria"
}
```

**Response 401 Unauthorized:**

```json
{
  "error": "INVALID_TOTP",
  "message": "El código de verificación es inválido o expiró",
  "metadata": {},
  "timestamp": "2026-07-01T10:30:00Z"
}
```

**Response 410 Gone** (pasaron los 5 minutos y la entrada de Caffeine ya expiró):

```json
{
  "error": "TWOFA_SESSION_EXPIRED",
  "message": "La sesión de verificación expiró. Inicie sesión nuevamente",
  "metadata": {},
  "timestamp": "2026-07-01T10:30:00Z"
}
```

### 2. `PUT /api/auth/change-password`

**Acceso:** Usuario autenticado

**Body:**

```json
{
  "passwordActual": "Clave123!",
  "passwordNueva": "NuevaClave456!"
}
```

**Response 200 OK:**

```json
{
  "message": "Contraseña actualizada correctamente"
}
```

### 3. `POST /api/auth/2fa/enable`

**Acceso:** Usuario autenticado (requiere password actual, no requiere 2FA todavía ya que se está activando)

**Descripción:** Genera un secreto TOTP nuevo para el usuario autenticado, lo persiste cifrado en `Usuario.totpSecret` y marca `dosFactorHabilitado = true`. Devuelve la URI `otpauth://` para que el frontend renderice el QR que se escanea con Google Authenticator. No emite un JWT nuevo; la sesión activa sigue siendo válida hasta que expire. La activación queda registrada en `Auditoria` (`modulo = "auth"`).

**Body:**

```json
{
  "password": "Clave123!"
}
```

**Response 200 OK:**

```json
{
  "secretoQr": "otpauth://totp/SIGEA:jperez?secret=JBSWY3DPEHPK3PXP&issuer=SIGEA",
  "dosFactorHabilitado": true
}
```

**Response 401 Unauthorized** (password actual incorrecta):

```json
{
  "error": "INVALID_CREDENTIALS",
  "message": "Contraseña incorrecta",
  "metadata": {},
  "timestamp": "2026-07-01T10:30:00Z"
}
```

> Una vez habilitado, todo login de ese usuario pasa por el flujo de dos pasos (`POST /api/auth/login` → `requiere2FA: true` → `POST /api/auth/login/verify-2fa`) descrito arriba. No existe un endpoint para deshabilitar 2FA en el alcance de este proyecto — si se necesita, es una extensión, no un requisito del enunciado.

## 🟦 MICROMÓDULO: Usuarios y Permisos

### 1. `POST /api/usuarios`

**Acceso:** Superusuario

**Descripción:** Crea un usuario y le asigna un rol.

**Body:**

```json
{
  "usuario": "mvargas",
  "password": "TempPass1!",
  "idRol": 3
}
```

**Response 201 Created:**

```json
{
  "idUsuario": 15,
  "usuario": "mvargas",
  "idRol": 3,
  "estado": true,
  "fechaRegistro": "2026-07-01T10:30:00Z"
}
```

### 2. `GET /api/funcionalidades/tree`

**Acceso:** Superusuario

**Descripción:** Devuelve el árbol de funcionalidades (usa el campo `padre`) para construir el menú y la matriz de permisos.

**Response 200 OK:**

```json
[
  {
    "idFuncionalidad": 1,
    "nombre": "Seguridad",
    "hijos": [
      { "idFuncionalidad": 2, "nombre": "Usuarios" },
      { "idFuncionalidad": 3, "nombre": "Roles" },
      { "idFuncionalidad": 4, "nombre": "Permisos" }
    ]
  },
  {
    "idFuncionalidad": 5,
    "nombre": "Matrícula",
    "hijos": [
      { "idFuncionalidad": 6, "nombre": "Aulas" },
      { "idFuncionalidad": 7, "nombre": "Alumnos" },
      { "idFuncionalidad": 8, "nombre": "Registrar Matrícula" }
    ]
  }
]
```

### 3. `PUT /api/roles/{idRol}/permisos`

**Acceso:** Superusuario

**Descripción:** Aplica permisos (Ver/Crear/Editar/Eliminar/Imprimir) mediante checkboxes y el botón "Aplicar". Los permisos de cada rol se cachean en Caffeine (clave = `idRol`, sin TTL, invalidación manual) para evitar consultar `Rol_Funcionalidad` en cada request autenticado. **Este endpoint debe invalidar (`cache.invalidate(idRol)`) la entrada de ese rol antes de responder** — si se omite, los usuarios de ese rol seguirían operando con los permisos anteriores hasta que la app se reinicie.

**Body:**

```json
{
  "permisos": [
    { "idFuncionalidad": 6, "ver": true, "crear": true, "editar": true, "eliminar": false, "imprimir": true },
    { "idFuncionalidad": 8, "ver": true, "crear": true, "editar": false, "eliminar": false, "imprimir": false }
  ]
}
```

**Response 200 OK:**

```json
{
  "idRol": 3,
  "message": "Permisos actualizados correctamente"
}
```

## 🟩 MICROMÓDULO: Aulas

### 1. `POST /api/aulas`

**Acceso:** Secretaria / Superusuario

**Body:**

```json
{
  "codAnioAcademico": 2026,
  "codNivel": 2,
  "codGrado": 1,
  "seccion": "A",
  "capacidadMaxima": 35
}
```

**Response 201 Created:**

```json
{
  "codAula": 41,
  "codAnioAcademico": 2026,
  "codNivel": 2,
  "codGrado": 1,
  "seccion": "A",
  "capacidadMaxima": 35,
  "estado": true
}
```

**Response 409 Conflict** (violación de la unique key año+nivel+grado+sección):

```json
{
  "error": "AULA_DUPLICADA",
  "message": "Ya existe un aula 2026 - Primaria - 1° - A",
  "metadata": {
    "codAnioAcademico": 2026,
    "codNivel": 2,
    "codGrado": 1,
    "seccion": "A"
  },
  "timestamp": "2026-07-01T10:30:00Z"
}
```

### 2. `GET /api/aulas?anioAcademico=2026&nivel=2`

**Acceso:** Todos los roles (consulta)

**Response 200 OK:**

```json
[
  { "codAula": 41, "seccion": "A", "capacidadMaxima": 35, "vacantesDisponibles": 4 },
  { "codAula": 42, "seccion": "B", "capacidadMaxima": 35, "vacantesDisponibles": 0 }
]
```

## 🟨 MICROMÓDULO: Alumnos

### 1. `POST /api/alumnos`

**Acceso:** Secretaria / Superusuario

**Descripción:** Registra un alumno. `numeroDocumento` y `fechaNacimiento` se cifran con AES antes de persistir.

**Body:**

```json
{
  "codTipoDocumento": 1,
  "numeroDocumento": "71234567",
  "nombres": "Valeria",
  "apellidoPaterno": "Fernández",
  "apellidoMaterno": "Torres",
  "fechaNacimiento": "2015-03-12"
}
```

**Response 201 Created:**

```json
{
  "codAlumno": 208,
  "nombres": "Valeria",
  "apellidoPaterno": "Fernández",
  "apellidoMaterno": "Torres",
  "estado": true,
  "fechaRegistro": "2026-07-01T10:30:00Z"
}
```

**Response 409 Conflict:**

```json
{
  "error": "ALUMNO_DUPLICADO",
  "message": "Ya existe un alumno con ese tipo y número de documento",
  "metadata": {
    "codTipoDocumento": 1
  },
  "timestamp": "2026-07-01T10:30:00Z"
}
```

## 🟧 MICROMÓDULO: Conceptos (Tarifario)

### 1. `POST /api/conceptos`

**Acceso:** Superusuario / Secretaria

**Body:**

```json
{
  "codAnioAcademico": 2026,
  "codTipoConcepto": 1,
  "nombreConcepto": "Matrícula",
  "monto": 350.00,
  "ordenPago": 1,
  "obligatorio": true
}
```

**Response 201 Created:**

```json
{
  "codConcepto": 77,
  "nombreConcepto": "Matrícula",
  "monto": 350.00,
  "ordenPago": 1,
  "version": 0
}
```

**Response 409 Conflict** (concurrencia — optimistic lock):

```json
{
  "error": "VERSION_CONFLICT",
  "message": "El registro fue modificado por otro usuario. Actualice la pantalla antes de continuar.",
  "metadata": {
    "versionActual": 3,
    "versionEnviada": 2
  },
  "timestamp": "2026-07-01T10:30:00Z"
}
```

### 2. `POST /api/conceptos/clonar`

**Acceso:** Superusuario

**Descripción:** Clona los conceptos de un año académico a otro.

**Body:**

```json
{
  "anioOrigen": 2025,
  "anioDestino": 2026
}
```

**Response 200 OK:**

```json
{
  "conceptosClonados": 6,
  "anioDestino": 2026
}
```

## 🟥 MICROMÓDULO: Matrícula

### 1. `POST /api/matriculas`

**Acceso:** Secretaria / Superusuario — **requiere que la sesión haya completado 2FA**

**Descripción:** El doble factor ya se verificó en `POST /api/auth/login/verify-2fa`; el JWT emitido en ese paso queda marcado como `2fa: true` en sus claims. Este endpoint valida ese claim en el token, no solicita un código TOTP adicional en cada petición.

**Headers:**

```
Authorization: Bearer <token>
```

**Body:**

```json
{
  "codAlumno": 208,
  "codAula": 41,
  "codAnioAcademico": 2026
}
```

**Validaciones ejecutadas antes de matricular:**

- El aula existe.
- El alumno existe.
- El alumno no está matriculado ese año.
- El aula tiene vacantes disponibles (límite configurable en tabla `Parámetro`).
- El alumno no tiene deudas de años anteriores (regla de negocio configurable).
- Existen conceptos activos para el año académico.

**Response 201 Created:**

```json
{
  "codMatricula": 550,
  "codAlumno": 208,
  "codAula": 41,
  "codAnioAcademico": 2026,
  "cuotasGeneradas": 10,
  "fechaMatricula": "2026-07-01T10:30:00Z"
}
```

**Response 422 Unprocessable Entity:**

```json
{
  "error": "AULA_SIN_VACANTES",
  "message": "El aula seleccionada no tiene vacantes disponibles",
  "metadata": {
    "codAula": 41,
    "capacidadMaxima": 35
  },
  "timestamp": "2026-07-01T10:30:00Z"
}
```

**Response 403 Forbidden** (sesión sin 2FA verificado):

```json
{
  "error": "TWOFA_REQUIRED",
  "message": "Esta operación requiere una sesión con doble factor verificado",
  "metadata": {},
  "timestamp": "2026-07-01T10:30:00Z"
}
```

**Transacción del proceso** (atómica, con rollback total ante cualquier error):

```
Alumno → Registrar Matrícula → Generar Cuotas → Actualizar Aula → Registrar Auditoría → Commit
```

## 🟪 MICROMÓDULO: Pagos

### 1. `GET /api/pagos/deudas?codAlumno=208&anio=2026`

**Acceso:** Secretaria / Superusuario / Director (solo consulta)

**Response 200 OK:**

```json
[
  { "codCuota": 1100, "concepto": "Matrícula", "ordenPago": 1, "monto": 350.00, "estado": "PENDIENTE" },
  { "codCuota": 1101, "concepto": "Marzo", "ordenPago": 2, "monto": 280.00, "estado": "BLOQUEADA" }
]
```

> Las cuotas de orden superior permanecen `BLOQUEADA` mientras existan cuotas anteriores pendientes.

### 2. `POST /api/pagos`

**Acceso:** Secretaria / Superusuario

**Body:**

```json
{
  "codCuota": 1100,
  "montoPagado": 350.00,
  "medioPago": "EFECTIVO"
}
```

**Response 201 Created:**

```json
{
  "numeroRecibo": "R-2026-000481",
  "codCuota": 1100,
  "estado": "PAGADA",
  "fechaPago": "2026-07-01T10:30:00Z"
}
```

**Response 400 Bad Request:**

```json
{
  "error": "CUOTA_ANTERIOR_PENDIENTE",
  "message": "No puede pagar esta cuota mientras existan cuotas anteriores pendientes",
  "metadata": {
    "codCuota": 1100,
    "codCuotaPendienteAnterior": 1098
  },
  "timestamp": "2026-07-01T10:30:00Z"
}
```

## 🟫 MICROMÓDULO: Auditoría

### 1. `GET /api/auditoria?tabla=Matricula&fechaInicio=2026-06-01&fechaFin=2026-07-01`

**Acceso:** Superusuario

**Response 200 OK:**

```json
[
  {
    "codAuditoria": 9021,
    "codUsuario": 12,
    "modulo": "Matrícula",
    "tablaAfectada": "Matricula",
    "operacion": "MATRICULA",
    "codigoRegistro": 550,
    "valorAnterior": null,
    "valorNuevo": "{\"codAlumno\":208,\"codAula\":41}",
    "fechaHora": "2026-07-01T10:30:00Z",
    "ipOrigen": "192.168.1.42"
  }
]
```

## 🟦 MICROMÓDULO: Reportes

### 1. `GET /api/reportes/matriculas?anioAcademico=2026&codNivel=2`

**Acceso:** Superusuario / Director (consulta) / Secretaria

**Descripción:** Reporte de alumnos matriculados, filtrable por año académico, nivel, grado y aula.

**Response 200 OK:**

```json
[
  {
    "codMatricula": 550,
    "alumno": "Fernández Torres, Valeria",
    "aula": "Primaria - 1° - A",
    "fechaMatricula": "2026-07-01T10:30:00Z",
    "estadoCuotas": "1 pagada / 9 pendientes"
  }
]
```

### 2. `GET /api/reportes/pagos?anioAcademico=2026&fechaInicio=2026-06-01&fechaFin=2026-07-01`

**Acceso:** Superusuario / Director (consulta) / Secretaria

**Descripción:** Reporte de pagos recibidos en un rango de fechas, con totales.

**Response 200 OK:**

```json
{
  "totalRecaudado": 12600.00,
  "cantidadPagos": 36,
  "pagos": [
    { "numeroRecibo": "R-2026-000481", "alumno": "Fernández Torres, Valeria", "concepto": "Matrícula", "monto": 350.00, "fechaPago": "2026-07-01T10:30:00Z" }
  ]
}
```

### 3. `GET /api/reportes/deudas?anioAcademico=2026`

**Acceso:** Superusuario / Director (consulta) / Secretaria

**Descripción:** Reporte consolidado de alumnos con cuotas `PENDIENTE` o `BLOQUEADA`, para gestión de cobranza.

**Response 200 OK:**

```json
[
  { "codAlumno": 208, "alumno": "Fernández Torres, Valeria", "cuotasPendientes": 9, "montoAdeudado": 2520.00 }
]
```

> Los tres reportes son de solo lectura (no generan registro de auditoría de escritura) y deben poder exportarse a PDF/Excel desde el frontend (librería a elección del equipo, ej. iText / Apache POI).

## 🗃 Modelo de Datos

### Usuario

| Campo | Tipo | Llave |
|---|---|---|
| idUsuario | Integer | PK |
| usuario | Varchar(30) | UK |
| password | Varchar(255) | - |
| idRol | Integer | FK |
| dosFactorHabilitado | Boolean | - |
| totpSecret | Varchar(255) | - |
| estado | Boolean | - |
| fechaRegistro | Timestamp | - |
| usuarioCreacion | Integer | FK Usuario |
| fechaModificacion | Timestamp | - |

> `totpSecret` se persiste cifrado con `AesConverter` (`@Convert`) y solo se genera cuando el propio usuario activa 2FA (ver `POST /api/auth/2fa/enable`); nunca se expone en ningún DTO de respuesta. `dosFactorHabilitado = false` es el valor por defecto — el login sin 2FA habilitado devuelve el token directamente en el paso 1.

### Rol

| Campo | Tipo | Llave |
|---|---|---|
| idRol | Integer | PK |
| nombreRol | Varchar(40) | UK |
| estado | Boolean | - |

### Funcionalidad

| Campo | Tipo | Llave |
|---|---|---|
| idFuncionalidad | Integer | PK |
| nombre | Varchar(80) | UK |
| icono | Varchar(60) | - |
| padre | Integer | FK (misma tabla) |

### Rol_Funcionalidad (Permisos)

| Campo | Tipo | Llave |
|---|---|---|
| idRolFuncionalidad | Integer | PK |
| idRol | Integer | FK |
| idFuncionalidad | Integer | FK |
| ver / crear / editar / eliminar / imprimir | Boolean | - |

### Tablas de catálogo

Estas tablas son referenciadas como FK desde `Aula`, `Alumno`, `Concepto` y `Matricula`. No tienen lógica de negocio propia más allá de un CRUD simple con eliminación lógica.

#### AnioAcademico

| Campo | Tipo | Llave | Restricciones |
|---|---|---|---|
| codAnioAcademico | Integer | PK | Ej. 2026 |
| descripcion | Varchar(40) | - | Ej. "Año Escolar 2026" |
| fechaInicio | Date | - | - |
| fechaFin | Date | - | - |
| estado | Boolean | - | Solo un año puede estar "activo" a la vez (regla de aplicación) |

#### Nivel

| Campo | Tipo | Llave | Restricciones |
|---|---|---|---|
| codNivel | Integer | PK | Auto increment |
| nombreNivel | Varchar(40) | UK | Inicial, Primaria, Secundaria |
| estado | Boolean | - | Eliminación lógica |

#### Grado

| Campo | Tipo | Llave | Restricciones |
|---|---|---|---|
| codGrado | Integer | PK | Auto increment |
| codNivel | Integer | FK | Grado pertenece a un nivel |
| nombreGrado | Varchar(20) | - | 1°, 2°, 3 años... |
| estado | Boolean | - | Eliminación lógica |

**Unique key:** `(codNivel, nombreGrado)`

#### TipoDocumento

| Campo | Tipo | Llave | Restricciones |
|---|---|---|---|
| codTipoDocumento | Integer | PK | Auto increment |
| nombreTipoDocumento | Varchar(30) | UK | DNI, Carné de Extranjería, Pasaporte |
| estado | Boolean | - | Eliminación lógica |

#### TipoConcepto

| Campo | Tipo | Llave | Restricciones |
|---|---|---|---|
| codTipoConcepto | Integer | PK | Auto increment |
| nombreTipoConcepto | Varchar(40) | UK | Matrícula, Pensión, Materiales |
| estado | Boolean | - | Eliminación lógica |

#### Parámetro

Tabla de configuración clave-valor usada, entre otras cosas, para el límite de vacantes por aula y otras reglas de negocio configurables sin tocar código.

| Campo | Tipo | Llave | Restricciones |
|---|---|---|---|
| codParametro | Integer | PK | Auto increment |
| clave | Varchar(60) | UK | Ej. `VACANTES_MAXIMAS_DEFAULT`, `VALIDAR_DEUDA_ANIO_ANTERIOR` |
| valor | Varchar(200) | - | Almacenado como texto, casteado según el tipo esperado |
| descripcion | Varchar(200) | - | Explicación legible del parámetro |

> **Nota:** solo `Parámetro.valor` se cachea en Caffeine (clave = `clave`, TTL de 60s, refresco periódico). El conteo real de vacantes disponibles por aula (`capacidadMaxima` menos matriculados) **no** se cachea: se resuelve siempre contra la base de datos dentro de la misma transacción de matrícula, para no arriesgar sobrematricular un aula por datos desincronizados.

### Aula

| Campo | Tipo | Llave | Restricciones |
|---|---|---|---|
| codAula | Integer | PK | Auto increment |
| codAnioAcademico | Integer | FK | Año académico |
| codNivel | Integer | FK | Nivel |
| codGrado | Integer | FK | Grado |
| seccion | Varchar(2) | - | A, B, C... |
| capacidadMaxima | Smallint | - | Ej. 35 |
| estado | Boolean | - | Eliminación lógica |
| fechaRegistro | Timestamp | - | Auditoría |

**Unique key:** `(codAnioAcademico, codNivel, codGrado, seccion)`

### Alumno

| Campo | Tipo | Llave | Restricciones |
|---|---|---|---|
| codAlumno | Integer | PK | Identity |
| codTipoDocumento | Integer | FK | Tabla Tipo Documento |
| numeroDocumento | Varchar(15) | UK | Cifrado AES |
| nombres | Varchar(80) | - | Obligatorio |
| apellidoPaterno | Varchar(60) | - | Obligatorio |
| apellidoMaterno | Varchar(60) | - | Obligatorio |
| fechaNacimiento | Date | - | Cifrado AES |
| estado | Boolean | - | Eliminación lógica |
| fechaRegistro | Timestamp | - | Auditoría |

**Unique key:** `(codTipoDocumento, numeroDocumento)`

### Concepto

| Campo | Tipo | Llave | Restricciones |
|---|---|---|---|
| codConcepto | Integer | PK | Identity |
| codAnioAcademico | Integer | FK | Año académico |
| codTipoConcepto | Integer | FK | Tipo concepto |
| nombreConcepto | Varchar(80) | - | Matrícula, Marzo... |
| monto | Numeric(10,2) | - | Mayor que cero |
| ordenPago | Smallint | - | Secuencia de pago |
| obligatorio | Boolean | - | Sí / No |
| version | Integer | - | Optimistic lock |
| estado | Boolean | - | Eliminación lógica |

**Unique key:** `(codAnioAcademico, nombreConcepto)`

### Matricula

| Campo | Tipo | Llave | Restricciones |
|---|---|---|---|
| codMatricula | Integer | PK | Auto increment |
| codAlumno | Integer | FK | Alumno matriculado |
| codAula | Integer | FK | Aula asignada |
| codAnioAcademico | Integer | FK | Año académico |
| fechaMatricula | Timestamp | - | Auditoría |
| estado | Boolean | - | Eliminación lógica (anulación de matrícula) |

**Unique key:** `(codAlumno, codAnioAcademico)` — un alumno no puede matricularse dos veces en el mismo año.

### Cuota

Generada automáticamente al registrar una matrícula, a partir de los `Concepto` activos del año académico.

| Campo | Tipo | Llave | Restricciones |
|---|---|---|---|
| codCuota | Integer | PK | Auto increment |
| codMatricula | Integer | FK | Matrícula que originó la cuota |
| codConcepto | Integer | FK | Concepto del tarifario que generó la cuota |
| montoPagar | Numeric(10,2) | - | Copiado del `monto` del concepto al momento de generar la cuota |
| ordenPago | Smallint | - | Copiado del concepto, define la secuencia de pago |
| estado | Varchar(20) | - | `PENDIENTE`, `BLOQUEADA`, `PAGADA` (enum `EstadoCuota`) |
| numeroRecibo | Varchar(20) | - | Asignado al pagar, ej. `R-2026-000481` |
| fechaPago | Timestamp | - | Nulo hasta que se pague |
| fechaRegistro | Timestamp | - | Auditoría |

### Auditoria

| Campo | Tipo | Llave | Restricciones |
|---|---|---|---|
| codAuditoria | Integer | PK | Auto increment |
| codUsuario | Integer | FK | Usuario |
| modulo | Varchar(50) | - | Obligatorio |
| tablaAfectada | Varchar(50) | - | Obligatorio |
| operacion | Varchar(20) | - | INSERT, UPDATE, DELETE, LOGIN, PAGO, MATRÍCULA... |
| codigoRegistro | Integer | - | PK del registro afectado |
| valorAnterior | Text | - | JSON |
| valorNuevo | Text | - | JSON |
| fechaHora | Timestamp | - | Fecha del servidor |
| ipOrigen | Varchar(45) | - | IPv4/IPv6 |
| equipo | Varchar(100) | - | Opcional |
| navegador | Varchar(150) | - | Opcional |

## 🧩 Enums

```
UserRole:        SUPERUSUARIO, DIRECTOR, SECRETARIA
EstadoCuota:      PENDIENTE, BLOQUEADA, PAGADA
MedioPago:        EFECTIVO, TRANSFERENCIA, TARJETA
TipoOperacion:    INSERT, UPDATE, DELETE, LOGIN, LOGIN_FAILED, LOGOUT, PAGO, MATRICULA
```

## 🔗 Reglas de negocio clave

- **Transacciones:** todos los procesos principales (matrícula, ventas, pagos) usan `@Transactional`; cualquier error dispara rollback completo, sin información parcial persistida.
- **Optimistic lock:** las tablas de proceso (ej. `Concepto`) implementan `version`. Si dos usuarios editan el mismo registro, el segundo commit es rechazado con `VERSION_CONFLICT` hasta refrescar pantalla.
- **Orden de pago:** no se puede pagar una cuota de orden superior sin cancelar antes las anteriores.
- **Auditoría total:** toda tabla registra usuario, fecha/hora, operación y registro afectado; todos los procesos y mantenimientos pasan por el interceptor de auditoría.
- **Rate limiting de login:** máximo 5 intentos fallidos por usuario en 10 minutos. Se implementa consultando `Auditoria` (`operacion = 'LOGIN_FAILED'`, `fechaHora > NOW() - INTERVAL 10 MINUTE`) antes de procesar cada login; si se supera el umbral, responde `429` con `LOGIN_BLOCKED` (ver ejemplo en `POST /api/auth/login`). Cada intento fallido de credenciales debe registrarse en `Auditoria` con `operacion = LOGIN_FAILED` antes de devolver `INVALID_CREDENTIALS`.

## 🏛 Decisión de Arquitectura: Caché y Rate Limiting

Este proyecto usa **Caffeine** (caché en memoria de la JVM) en vez de un store externo (Redis) para sesión pendiente de 2FA, permisos y parámetros, y reutiliza la tabla `Auditoria` en vez de un contador dedicado para el rate limiting de login. Esta decisión no es "no saber que existe la alternativa" — es una elección explícita, justificada por la topología real del proyecto, y se documenta aquí para poder sustentarla.

| Caso | Tecnología "de libro" en producción | Por qué no se usó aquí | Qué se usó en su lugar |
|---|---|---|---|
| 1. Sesión pendiente de 2FA | **Redis** — permite que la sesión sobreviva a un restart de la app y sea visible desde cualquier instancia si hay balanceo de carga | La topología de este proyecto define **una sola instancia** de `sigea` (Equipo 1). Sin una segunda instancia, no hay "otro proceso" que necesite leer ese estado, y la ventana de validez es de solo 5 minutos — un restart justo en esos 5 minutos es un caso borde de probabilidad muy baja | Caffeine con `expireAfterWrite(5, MINUTES)`, clave = `idUsuario` |
| 2. Caché de permisos por rol | **Redis**, idealmente con Pub/Sub para que un cambio de permisos se propague a todas las instancias al instante | Mismo motivo: sin múltiples instancias no hay nada que propagar entre procesos. Invalidar una entrada local en el `PUT` de permisos logra el mismo resultado | Caffeine sin TTL, invalidación manual explícita en `PUT /api/roles/{idRol}/permisos` |
| 3. Parámetros del sistema | **Redis** como caché compartido de config de bajo cambio | Cambian con tan poca frecuencia (año académico activo, vacantes default) que ni siquiera una caché sofisticada se justifica; hasta en sistemas grandes en producción este tipo de config suele cachearse localmente por instancia con refresco periódico | Caffeine con TTL corto (60s) y refresco periódico |
| 4. Rate limiting de login | **Redis** (`INCR` + `EXPIRE` atómico) o **Bucket4j** (algoritmo *token bucket*, más preciso que una ventana fija) | Ambas opciones añaden una dependencia o infraestructura nueva para resolver algo que la tabla `Auditoria` ya registra. El costo de una query adicional por login es insignificante dado el bajo volumen de ese endpoint, y reusar `Auditoria` evita mantener un mecanismo de conteo duplicado | Query sobre `Auditoria` filtrando `LOGIN_FAILED` en la ventana de 10 minutos |

**Limitación conocida (y por qué se acepta):** los cuatro diseños de arriba dejan de ser correctos si el proyecto alguna día corre con más de una instancia de `sigea` detrás de un balanceador — cada instancia tendría su propia caché de Caffeine, y el rate limiting por `Auditoria` seguiría siendo correcto (la BD es compartida) pero no así la caché de sesión/permisos/parámetros. Se documenta como una decisión consciente: el diseño es correcto para la topología de una sola instancia que exige la rúbrica de este proyecto, y la migración a Redis en un escenario de múltiples instancias sería un cambio acotado (reemplazar el `CacheManager` de Caffeine por uno de Redis vía `spring-boot-starter-data-redis`, sin tocar la lógica de negocio que lo consume).

## 🐳 Contenerización

### Dockerfile (multi-stage, optimizado)

Sobre la referencia base se separan las capas de Spring Boot (`layertools`) en su propia etapa. Esto mejora el cacheo de capas de Docker: si solo cambia el código de la app, las capas de `dependencies/` y `spring-boot-loader/` no se reconstruyen.

```dockerfile
# ---- Etapa 1: build del jar con Maven ----
FROM maven:3.9-eclipse-temurin-21-alpine AS builder
WORKDIR /app
COPY pom.xml .
RUN --mount=type=cache,target=/root/.m2 mvn dependency:go-offline -B
COPY src ./src
RUN --mount=type=cache,target=/root/.m2 mvn clean package -DskipTests -B

# ---- Etapa 2: extracción de capas (Spring Boot layertools) ----
FROM eclipse-temurin:21-jre-alpine AS layers
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
RUN java -Djarmode=layertools -jar app.jar extract

# ---- Etapa 3: imagen final, mínima y sin privilegios ----
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring
COPY --from=layers /app/dependencies/ ./
COPY --from=layers /app/spring-boot-loader/ ./
COPY --from=layers /app/snapshot-dependencies/ ./
COPY --from=layers /app/application/ ./
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD wget -q --spider http://localhost:8080/actuator/health || exit 1
ENTRYPOINT ["java", "org.springframework.boot.loader.launch.JarLauncher"]
```

**Optimizaciones aplicadas respecto a la referencia:**

- `--mount=type=cache,target=/root/.m2` (BuildKit) cachea el repositorio Maven entre builds, sin depender de una capa Docker completa.
- Extracción por `layertools` en lugar de copiar el `.jar` completo: separa `dependencies` (cambia poco) de `application` (cambia en cada commit), reduciendo el tamaño de las capas que hay que re-subir al registry.
- `HEALTHCHECK` contra `/actuator/health`, útil para que `depends_on` con `condition: service_healthy` funcione correctamente en compose.
- `ENTRYPOINT` usa `JarLauncher` directamente sobre las capas extraídas en vez de `java -jar app.jar` (equivalente en runtime, pero coherente con el layout de `layertools`).



### docker-compose — tres archivos según el escenario

Se manejan **tres archivos** distintos, cada uno para una etapa del proyecto:

| Archivo | Uso | Dónde corre |
|---|---|---|
| `docker-compose.dev.yml` | Pruebas de desarrollo: levanta todo con un solo comando | 1 sola máquina (equipo del desarrollador) |
| `docker-compose.app.yml` | Prueba de despliegue real, solo el servidor web | Equipo 1 |
| `docker-compose.db.yml` | Prueba de despliegue real, solo el servidor de BD | Equipo 2 |

En desarrollo, `sigea` y las bases de datos comparten la misma red interna de Docker, así que pueden llamarse por nombre de servicio (`postgres-primaria`). En el despliegue de 2 equipos esa red ya no existe entre ambas máquinas, así que `sigea` debe apuntar a la **IP LAN** del Equipo 2 en vez del nombre de servicio.

**`docker-compose.dev.yml`** — todo en un equipo, para desarrollo y pruebas locales:

```yaml
services:
  postgres-primaria:
    image: postgres:15
    container_name: postgres-primaria
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_primaria_data:/var/lib/postgresql/data

  postgres-replica:
    image: postgres:15
    container_name: postgres-replica
    depends_on:
      - postgres-primaria
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    ports:
      - "5433:5432"
    volumes:
      - postgres_replica_data:/var/lib/postgresql/data

  sigea:
    build: ./sigea
    image: sigea
    container_name: sigea
    ports:
      - "8080:8080"
    depends_on:
      - postgres-primaria
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres-primaria:5432/${POSTGRES_DB}
      SPRING_DATASOURCE_USERNAME: ${POSTGRES_USER}
      SPRING_DATASOURCE_PASSWORD: ${POSTGRES_PASSWORD}
      AES_SECRET_KEY: ${AES_SECRET_KEY}
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRATION: ${JWT_EXPIRATION}
      TOTP_ISSUER: ${TOTP_ISSUER}
      SUPERUSER_USERNAME: ${SUPERUSER_USERNAME}
      SUPERUSER_PASSWORD: ${SUPERUSER_PASSWORD}

volumes:
  postgres_primaria_data:
  postgres_replica_data:
```

**`docker-compose.app.yml`** — se ejecuta en el **Equipo 1 (Servidor web)**:

```yaml
services:
  sigea:
    build: ./sigea
    image: sigea
    container_name: sigea
    ports:
      - "8080:8080"
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://${DB_HOST}:5432/${POSTGRES_DB}
      SPRING_DATASOURCE_USERNAME: ${POSTGRES_USER}
      SPRING_DATASOURCE_PASSWORD: ${POSTGRES_PASSWORD}
      AES_SECRET_KEY: ${AES_SECRET_KEY}
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRATION: ${JWT_EXPIRATION}
      TOTP_ISSUER: ${TOTP_ISSUER}
      SUPERUSER_USERNAME: ${SUPERUSER_USERNAME}
      SUPERUSER_PASSWORD: ${SUPERUSER_PASSWORD}
```

**`docker-compose.db.yml`** — se ejecuta en el **Equipo 2 (Servidor BD)**:

```yaml
services:
  postgres-primaria:
    image: postgres:15
    container_name: postgres-primaria
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_primaria_data:/var/lib/postgresql/data

  postgres-replica:
    image: postgres:15
    container_name: postgres-replica
    depends_on:
      - postgres-primaria
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    ports:
      - "5433:5432"
    volumes:
      - postgres_replica_data:/var/lib/postgresql/data

volumes:
  postgres_primaria_data:
  postgres_replica_data:
```

> **`.env` del Equipo 1** necesita además `DB_HOST=<ip-lan-equipo-2>` (ej. `192.168.1.20`), ya que `postgres-primaria` ya no es un nombre resoluble en la red del Equipo 1.
>
> El puerto 5432 de `postgres-primaria` debe quedar accesible desde la LAN (firewall del Equipo 2 permitiendo el rango de IPs del Equipo 1). La réplica se configura con streaming replication de PostgreSQL (`primary_conninfo` en `postgresql.conf` del nodo réplica, apuntando también por IP LAN).

## 🏗 Arquitectura de Despliegue

La topología física exigida por la rúbrica son 2 equipos conectados por LAN, cada uno con su propio Docker:

| Equipo | Contenedor(es) | Rol |
|---|---|---|
| Equipo 1 — Servidor web | `sigea` (puerto 8080) | Ejecuta el monolito Spring Boot: presentación, seguridad, servicios y persistencia |
| Equipo 2 — Servidor BD | `postgres-primaria` (5432), `postgres-replica` (5433) | Almacena los datos; la réplica se sincroniza por streaming replication |

El cliente (navegador) llega al Equipo 1 por HTTP; el Equipo 1 llega al Equipo 2 por JDBC usando la IP LAN, no un nombre de servicio Docker, porque cada equipo tiene su propia red Docker aislada.



## 📚 Entregables

- ☐ Código fuente en repositorio Git del equipo
- ☐ Documentación Swagger/OpenAPI accesible en `/swagger-ui`
- ☐ Colección Postman con todos los endpoints del sistema
- ☐ `Dockerfile` + los tres `docker-compose.*.yml` funcionales: `dev` (app + BD primaria + BD réplica en un equipo), `app` (Equipo 1) y `db` (Equipo 2)
- ☐ `README.md` con instrucciones de instalación, variables de entorno y ejemplos de uso
- ☐ Pruebas unitarias/integración cubriendo login, matrícula (transacción + rollback) y pagos
- ☐ Evidencia de eliminación lógica, auditoría y optimistic lock funcionando
- ☐ Seeder idempotente del Superusuario inicial (`SUPERUSER_USERNAME`/`SUPERUSER_PASSWORD` por variable de entorno, nunca hardcodeado; reiniciar la app N veces no debe duplicar el usuario ni fallar)
- ☐ Demo en vivo mostrando el flujo completo: login → matrícula con 2FA → pago → auditoría → reportes
