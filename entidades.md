# Entidades del Sistema — SIGEA

> **Stack:** Spring Boot 3 / Java 17+ / JPA Hibernate / PostgreSQL
> **Base package:** `com.institucion.sigea`

---

## 1. AuditableEntity (Mapped Superclass)

Todas las entidades concretas (excepto `AuditoriaEntity`) heredan de esta clase base.

| Campo | Tipo | Columna | Restricciones |
|---|---|---|---|
| version | Long | — | `@Version` (bloqueo optimista) |
| estado | boolean | — | nullable=false, default=true |
| fechaRegistro | Instant | — | nullable=false, updatable=false, `@CreatedDate` |
| fechaModificacion | Instant | — | nullable=false, `@LastModifiedDate` |
| usuarioCreacion | Usuario (ManyToOne LAZY) | `usuario_creacion_id` | updatable=false, `@CreatedBy` |
| usuarioModificacion | Usuario (ManyToOne LAZY) | `usuario_modificacion_id` | `@LastModifiedBy` |

---

## 2. AuditoriaEntity

Tabla: `auditoria`

| Campo | Tipo | Columna | Restricciones |
|---|---|---|---|
| id | Long | `cod_auditoria` | PK, IDENTITY |
| usuario | Usuario (ManyToOne LAZY) | `cod_usuario` | |
| modulo | String | `modulo` | nullable=false, length=50 |
| tablaAfectada | String | `tabla_afectada` | length=50 |
| operacion | TipoOperacionAuditoria (enum STRING) | `operacion` | nullable=false, length=20 |
| codigoRegistro | String | `codigo_registro` | length=20 |
| valorAnterior | String | `valor_anterior` | `@Lob` |
| valorNuevo | String | `valor_nuevo` | `@Lob` |
| fechaHora | Instant | `fecha_hora` | nullable=false |
| ipOrigen | String | `ip_origen` | nullable=false, length=45 |
| equipo | String | `equipo` | length=100 |
| navegador | String | `navegador` | length=150 |

**Relaciones:**
- `usuario` → Usuario (FK: `cod_usuario`)

---

## 3. Alumno

Tabla: `alumno` — Hereda de `AuditableEntity`

| Campo | Tipo | Columna | Restricciones |
|---|---|---|---|
| id | Long | `cod_alumno` | PK, IDENTITY |
| codigo | String | `codigo` | nullable=false, unique, length=20 |
| tipoDocumento | TipoDocumento (ManyToOne LAZY) | `tipo_documento_id` | nullable=false |
| numeroDocumento | String | `numero_documento` | nullable=false, length=255, **encriptado** (AES determinista) |
| nombres | String | `nombres` | nullable=false, length=80 |
| apellidoPaterno | String | `apellido_paterno` | nullable=false, length=60 |
| apellidoMaterno | String | `apellido_materno` | nullable=false, length=60 |
| fechaNacimiento | String | `fecha_nacimiento` | nullable=false, length=255, **encriptado** (AES no determinista) |

**Relaciones:**
- `tipoDocumento` → TipoDocumento (FK: `tipo_documento_id`)

**Campos encriptados:** `numeroDocumento` (determinista — permite búsquedas exactas), `fechaNacimiento` (no determinista)

---

## 4. TipoDocumento

Tabla: `tipo_documento` — Hereda de `AuditableEntity`

| Campo | Tipo | Columna | Restricciones |
|---|---|---|---|
| id | Long | `cod_tipo_documento` | PK, IDENTITY |
| descripcion | String | `descripcion` | nullable=false, unique, length=40 |

---

## 5. Parametro

Tabla: `parametro` — Hereda de `AuditableEntity`

| Campo | Tipo | Columna | Restricciones |
|---|---|---|---|
| id | Long | `cod_parametro` | PK, IDENTITY |
| clave | String | `clave` | nullable=false, unique, length=60 |
| valor | String | `valor` | nullable=false, length=255 |
| descripcion | String | `descripcion` | length=200 |

---

## 6. Nivel

Tabla: `nivel` — Hereda de `AuditableEntity`

| Campo | Tipo | Columna | Restricciones |
|---|---|---|---|
| id | Long | `cod_nivel` | PK, IDENTITY |
| nombre | String | `nombre` | nullable=false, unique, length=30 |

---

## 7. Grado

Tabla: `grado` — Hereda de `AuditableEntity`
Unique: `(nivel_id, nombre_grado)`

| Campo | Tipo | Columna | Restricciones |
|---|---|---|---|
| id | Long | `cod_grado` | PK, IDENTITY |
| nivel | Nivel (ManyToOne LAZY) | `nivel_id` | nullable=false |
| nombreGrado | String | `nombre_grado` | nullable=false, length=20 |

**Relaciones:**
- `nivel` → Nivel (FK: `nivel_id`)

---

## 8. Aula

Tabla: `aula` — Hereda de `AuditableEntity`
Unique: `(anio_academico_id, nivel_id, grado_id, seccion)`

| Campo | Tipo | Columna | Restricciones |
|---|---|---|---|
| id | Long | `cod_aula` | PK, IDENTITY |
| codigo | String | `codigo` | nullable=false, unique, length=20 |
| anioAcademico | AnioAcademico (ManyToOne LAZY) | `anio_academico_id` | nullable=false |
| nivel | Nivel (ManyToOne LAZY) | `nivel_id` | nullable=false |
| grado | Grado (ManyToOne LAZY) | `grado_id` | nullable=false |
| seccion | String | `seccion` | nullable=false, length=2 |
| capacidadMaxima | short | `capacidad_maxima` | nullable=false |

**Relaciones:**
- `anioAcademico` → AnioAcademico (FK: `anio_academico_id`)
- `nivel` → Nivel (FK: `nivel_id`)
- `grado` → Grado (FK: `grado_id`)

---

## 9. AnioAcademico

Tabla: `anio_academico` — Hereda de `AuditableEntity`

| Campo | Tipo | Columna | Restricciones |
|---|---|---|---|
| id | Long | `cod_anio_academico` | PK, IDENTITY |
| anio | Integer | `anio` | nullable=false, unique |

---

## 10. Concepto

Tabla: `concepto` — Hereda de `AuditableEntity`
Unique: `(anio_academico_id, nombre_concepto)`

| Campo | Tipo | Columna | Restricciones |
|---|---|---|---|
| id | Long | `cod_concepto` | PK, IDENTITY |
| anioAcademico | AnioAcademico (ManyToOne LAZY) | `anio_academico_id` | nullable=false |
| tipoConcepto | TipoConcepto (ManyToOne LAZY) | `tipo_concepto_id` | nullable=false |
| nombreConcepto | String | `nombre_concepto` | nullable=false, length=80 |
| monto | BigDecimal | `monto` | nullable=false, precision=10, scale=2 |
| ordenPago | short | `orden_pago` | nullable=false |
| obligatorio | boolean | `obligatorio` | nullable=false |

**Relaciones:**
- `anioAcademico` → AnioAcademico (FK: `anio_academico_id`)
- `tipoConcepto` → TipoConcepto (FK: `tipo_concepto_id`)

---

## 11. TipoConcepto

Tabla: `tipo_concepto` — Hereda de `AuditableEntity`

| Campo | Tipo | Columna | Restricciones |
|---|---|---|---|
| id | Long | `cod_tipo_concepto` | PK, IDENTITY |
| nombre | String | `nombre` | nullable=false, unique, length=60 |

---

## 12. Usuario

Tabla: `usuario` — Hereda de `AuditableEntity`

| Campo | Tipo | Columna | Restricciones |
|---|---|---|---|
| id | Long | `cod_usuario` | PK, IDENTITY |
| codigo | String | `codigo` | nullable=false, unique, length=20 |
| nombreUsuario | String | `nombre_usuario` | nullable=false, unique, length=255, **encriptado** (AES determinista) |
| nombre | String | `nombre` | nullable=false, length=100 |
| primerApellido | String | `primer_apellido` | nullable=false, length=100 |
| numeroDocumento | String | `numero_documento` | nullable=false, unique, length=255, **encriptado** (AES determinista) |
| password | String | `password` | nullable=false, length=255 |
| rol | Rol (ManyToOne LAZY) | `id_rol` | nullable=false |
| login2fa | boolean | `login2fa` | nullable=false |
| totpSecret | String | `totp_secret` | length=255, **encriptado** (AES no determinista) |
| totpVerificado | boolean | `totp_verificado` | nullable=false |

**Relaciones:**
- `rol` → Rol (FK: `id_rol`)

**Campos encriptados:** `nombreUsuario`, `numeroDocumento` (determinista), `totpSecret` (no determinista)

---

## 13. Rol

Tabla: `rol` — Hereda de `AuditableEntity`

| Campo | Tipo | Columna | Restricciones |
|---|---|---|---|
| id | Long | `cod_rol` | PK, IDENTITY |
| nombre | String | `nombre_rol` | nullable=false, unique, length=40 |

**Relaciones inversas:**
- `usuarios` → List\<Usuario\> (OneToMany, mappedBy="rol")

---

## 14. Funcionalidad

Tabla: `funcionalidad` — Hereda de `AuditableEntity`

| Campo | Tipo | Columna | Restricciones |
|---|---|---|---|
| id | Long | `cod_funcionalidad` | PK, IDENTITY |
| nombre | String | `nombre` | nullable=false, unique, length=80 |
| codigo | String | `codigo` | nullable=false, unique, length=50 |
| padre | Funcionalidad (ManyToOne LAZY) | `padre_id` | auto-referencia (menú jerárquico) |

**Relaciones:**
- `padre` → Funcionalidad (auto-referencia, FK: `padre_id`)
- `hijos` → List\<Funcionalidad\> (OneToMany, mappedBy="padre")

---

## 15. RolFuncionalidad

Tabla: `rol_funcionalidad` — Hereda de `AuditableEntity`
Unique: `(rol_id, funcionalidad_id)`

| Campo | Tipo | Columna | Restricciones |
|---|---|---|---|
| id | Long | `cod_rol_funcionalidad` | PK, IDENTITY |
| rol | Rol (ManyToOne LAZY) | `rol_id` | nullable=false |
| funcionalidad | Funcionalidad (ManyToOne LAZY) | `funcionalidad_id` | nullable=false |
| ver | boolean | `ver` | nullable=false |
| crear | boolean | `crear` | nullable=false |
| editar | boolean | `editar` | nullable=false |
| eliminar | boolean | `eliminar` | nullable=false |
| imprimir | boolean | `imprimir` | nullable=false |

**Relaciones:**
- `rol` → Rol (FK: `rol_id`)
- `funcionalidad` → Funcionalidad (FK: `funcionalidad_id`)

---

## 16. Recibo

Tabla: `recibo` — Hereda de `AuditableEntity`
Unique: `numero_recibo`

| Campo | Tipo | Columna | Restricciones |
|---|---|---|---|
| id | Long | `cod_recibo` | PK, SEQUENCE (seq_recibo) |
| numeroRecibo | String | `numero_recibo` | nullable=false, unique, length=20 |
| codPago | Integer | `cod_pago` | nullable=false, unique |
| anio | Integer | `anio` | nullable=false |
| correlativo | Integer | `correlativo` | nullable=false |
| fechaEmision | LocalDateTime | `fecha_emision` | nullable=false, default now() |

---

## 17. Pago

Tabla: `pago` — Hereda de `AuditableEntity`

| Campo | Tipo | Columna | Restricciones |
|---|---|---|---|
| id | Long | `cod_pago` | PK, IDENTITY |
| codCuota | Integer | `cod_cuota` | nullable=false (FK lógica → Cuota) |
| montoPagado | BigDecimal | `monto_pagado` | nullable=false, precision=10, scale=2 |
| medioPago | MedioPago (enum STRING) | `medio_pago` | nullable=false, length=20 |
| fechaPago | LocalDateTime | `fecha_pago` | nullable=false, default now() |

---

## 18. Matricula

Tabla: `matricula` — Hereda de `AuditableEntity`
Unique: `(cod_alumno, cod_anio_academico)`

| Campo | Tipo | Columna | Restricciones |
|---|---|---|---|
| id | Long | `cod_matricula` | PK, IDENTITY |
| codigo | String | `codigo` | nullable=false, unique, length=20 |
| codAlumno | Integer | `cod_alumno` | nullable=false (FK lógica → Alumno) |
| codAula | Integer | `cod_aula` | nullable=false (FK lógica → Aula) |
| codAnioAcademico | Integer | `cod_anio_academico` | nullable=false (FK lógica → AnioAcademico) |
| fechaMatricula | LocalDateTime | `fecha_matricula` | nullable=false |

---

## 19. Cuota

Tabla: `cuota` — Hereda de `AuditableEntity`

| Campo | Tipo | Columna | Restricciones |
|---|---|---|---|
| id | Long | `cod_cuota` | PK, IDENTITY |
| codMatricula | Integer | `cod_matricula` | nullable=false (FK lógica → Matricula) |
| codConcepto | Integer | `cod_concepto` | nullable=false (FK lógica → Concepto) |
| montoPagar | BigDecimal | `monto_pagar` | nullable=false, precision=10, scale=2 |
| ordenPago | Short | `orden_pago` | nullable=false |
| estadoCuota | EstadoCuota (enum STRING) | `estado_cuota` | nullable=false, length=20, default PENDIENTE |
| numeroRecibo | String | `numero_recibo` | length=20 |
| fechaPago | LocalDateTime | `fecha_pago` | |

---

## Resumen de Relaciones

### FK con relación JPA (`@ManyToOne`)

| Entidad | Campo | Referencia | Columna |
|---|---|---|---|
| AuditableEntity | usuarioCreacion | Usuario | `usuario_creacion_id` |
| AuditableEntity | usuarioModificacion | Usuario | `usuario_modificacion_id` |
| AuditoriaEntity | usuario | Usuario | `cod_usuario` |
| Alumno | tipoDocumento | TipoDocumento | `tipo_documento_id` |
| Grado | nivel | Nivel | `nivel_id` |
| Aula | anioAcademico | AnioAcademico | `anio_academico_id` |
| Aula | nivel | Nivel | `nivel_id` |
| Aula | grado | Grado | `grado_id` |
| Concepto | anioAcademico | AnioAcademico | `anio_academico_id` |
| Concepto | tipoConcepto | TipoConcepto | `tipo_concepto_id` |
| Usuario | rol | Rol | `id_rol` |
| Funcionalidad | padre | Funcionalidad (auto) | `padre_id` |
| RolFuncionalidad | rol | Rol | `rol_id` |
| RolFuncionalidad | funcionalidad | Funcionalidad | `funcionalidad_id` |

### FK lógicas (Integer, sin relación JPA)

| Entidad | Columna | Referencia lógica |
|---|---|---|
| Pago | `cod_cuota` | Cuota |
| Matricula | `cod_alumno` | Alumno |
| Matricula | `cod_aula` | Aula |
| Matricula | `cod_anio_academico` | AnioAcademico |
| Cuota | `cod_matricula` | Matricula |
| Cuota | `cod_concepto` | Concepto |
| Recibo | `cod_pago` | Pago |

---

## Encriptación

Campos protegidos con `AttributeConverter` personalizados:

| Entidad | Campo | Tipo de encriptación | Uso |
|---|---|---|---|
| Alumno | numeroDocumento | AES determinista | Búsquedas exactas |
| Alumno | fechaNacimiento | AES no determinista | Privacidad |
| Usuario | nombreUsuario | AES determinista | Búsquedas exactas |
| Usuario | numeroDocumento | AES determinista | Búsquedas exactas |
| Usuario | totpSecret | AES no determinista | Privacidad |
