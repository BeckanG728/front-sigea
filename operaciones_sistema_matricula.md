# Operaciones del Sistema - App de Matrícula (Control de Cuentas)

## 0. Políticas de seguridad definidas

- Contraseña: mínimo 10 caracteres, debe incluir mayúsculas, minúsculas y números.
- Bloqueo de cuenta: 5 intentos fallidos de login en una ventana de 10 minutos → bloqueo de 10 minutos.
- Token de sesión (JWT): expira en 1 hora.
- Sesiones concurrentes: máximo 2 sesiones activas simultáneas por usuario; al superar el límite, se invalida la sesión más antigua.
- Doble factor (TOTP/Google Authenticator): obligatorio en Matrícula; opcional en Login.
- Intentos fallidos de OTP en Matrícula: 3 intentos → bloqueo de la operación por 5 minutos.
- TOTP Secret: generado automáticamente al crear el usuario; almacenado cifrado con AES con IV aleatorio.
- `totpVerificado`: flag que registra si el usuario escaneó el QR y validó un código OTP exitosamente al menos una vez. Mientras sea `false`, el backend retorna el QR en cada intento de matrícula. Una vez `true`, el QR no se vuelve a mostrar.
- `login2fa`: flag independiente que solo controla si Login exige 2FA. No se modifica durante el proceso de Matrícula.
- Cifrado AES de datos del alumno: determinístico en los campos usados como criterio de búsqueda (numeroDocumento); con IV aleatorio en los campos que no requieren búsqueda exacta (fechaNacimiento).
- Retención de auditoría: los registros se conservan 5 años por cumplimiento legal antes de poder purgarse/archivarse.
- Recuperación de contraseña olvidada: únicamente el Superusuario puede restablecerla manualmente; no existe autoservicio.
- Correlativo de recibos de pago: por año académico, reinicia cada año.
- Consulta de auditoría: exclusiva del Superusuario; ningún otro rol (incluido Director) tiene acceso, aunque tenga permisos de consulta en otros módulos.
- Conflicto de Optimistic Lock (Conceptos): al detectar una versión distinta, la operación se rechaza devolviendo el registro actual del servidor; el cliente debe refrescar la pantalla con esos datos antes de permitir un nuevo intento (no hay reintento automático ni sobrescritura silenciosa).
- Conflicto de Optimistic Lock (Aula en Matrícula): la lectura del aula usa `OPTIMISTIC_FORCE_INCREMENT` para forzar el incremento de `@Version` en el commit, aunque ningún campo de negocio se modifique. Si dos transacciones matriculan simultáneamente en la misma aula, la segunda falla con `OptimisticLockException` y debe reintentar manualmente.
- Habilitar 2FA para Login: no requiere contraseña, solo autenticación JWT vigente. Si el usuario aún no ha verificado el QR (`totpVerificado = false`), el endpoint retorna el QR en lugar de activar el flag.

## 1. Seguridad

### 1.1 Iniciar sesión

**Dominio de negocio:** Seguridad

**Nombre de operación:** Login

**Endpoint:** `POST /api/auth/login`

**Descripción:** Autentica a un usuario en el sistema validando sus credenciales y retorna la información necesaria para iniciar sesión, incluyendo su rol, los permisos asignados y el estado de 2FA.

**Datos de entrada:**
```json
{
  "usuario": "jperez",
  "password": "Str0ngP@ss123"
}
```

**Datos de respuesta:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "idUsuario": 1,
  "nombreUsuario": "jperez",
  "idRol": 3,
  "nombreRol": "Secretaria",
  "login2fa": false
}
```

**Validaciones:**
- Usuario y password obligatorios y no vacíos.
- Verificar que el usuario exista y esté activo (estado = true).
- Comparar el hash con salting del password ingresado contra el almacenado (nunca comparar en texto plano).
- Bloqueo de la cuenta tras 5 intentos fallidos consecutivos en una ventana de 10 minutos.
- El JWT emitido expira a la 1 hora; pasado ese tiempo se exige nuevo login o refresh token.
- Máximo 2 sesiones activas simultáneas por usuario; al iniciar una tercera sesión se invalida la más antigua.
- El código TOTP (Google Authenticator) es opcional en esta operación; si el usuario lo tiene activado (`login2fa = true`), se solicita como segundo paso y el JWT se emite con el claim `2fa: true`.
- Si el usuario tiene `login2fa = false`, el login procede directamente sin exigir 2FA.
- Registrar el intento (exitoso o fallido) en la tabla de Auditoría con operación LOGIN.
- No revelar si el error fue por usuario inexistente o password incorrecto (mensaje genérico) para evitar enumeración de usuarios.
- No exponer el password en la respuesta bajo ninguna circunstancia.

---

### 1.2 Cambiar contraseña

**Dominio de negocio:** Seguridad

**Nombre de operación:** CambiarPassword

**Endpoint:** `PUT /api/auth/change-password`

**Descripción:** Permite a un usuario autenticado actualizar su contraseña.

**Datos de entrada:**
```json
{
  "idUsuario": 1,
  "passwordActual": "Str0ngP@ss123",
  "passwordNuevo": "N3wP@ssword456",
  "confirmarPasswordNuevo": "N3wP@ssword456"
}
```

**Datos de respuesta:**
```json
{
  "message": "Contraseña actualizada correctamente"
}
```

**Validaciones:**
- passwordActual debe coincidir con el hash almacenado.
- passwordNuevo y confirmarPasswordNuevo deben coincidir.
- passwordNuevo no puede ser igual al passwordActual.
- passwordNuevo debe tener mínimo 10 caracteres e incluir al menos una mayúscula, una minúscula y un número.
- Volver a aplicar hash con salting antes de persistir.
- Registrar el cambio en Auditoría (operación UPDATE sobre tabla Usuario, sin exponer los valores del password en valorAnterior/valorNuevo).

---

### 1.3 Restablecer contraseña (por Superusuario)

**Dominio de negocio:** Seguridad

**Nombre de operación:** RestablecerPassword

**Endpoint:** *No implementado*

**Descripción:** Permite al Superusuario asignar una contraseña temporal a un usuario que olvidó la suya. No existe autoservicio de recuperación; el restablecimiento siempre lo ejecuta el Superusuario.

**Datos de entrada:**
```json
{
  "idUsuario": 5,
  "passwordTemporal": "Temp@2026!",
  "idUsuarioEjecutor": 1
}
```

**Datos de respuesta:**
```json
{
  "idUsuario": 5,
  "mensaje": "Contraseña restablecida correctamente. El usuario deberá cambiarla en su próximo inicio de sesión."
}
```

**Validaciones:**
- Solo el Superusuario puede ejecutar esta operación.
- passwordTemporal debe cumplir la misma política de complejidad (mínimo 10 caracteres, mayúsculas, minúsculas y números).
- Forzar el cambio de contraseña obligatorio en el siguiente login (flag de "cambio requerido").
- Invalidar todas las sesiones activas del usuario afectado al momento del restablecimiento.
- Registrar la operación en Auditoría (UPDATE sobre tabla Usuario, operación RESET_PASSWORD, sin exponer el valor de la contraseña).

---

### 1.4 Verificar segundo factor

**Dominio de negocio:** Seguridad

**Nombre de operación:** Verify2FA

**Endpoint:** `POST /api/auth/login/verify-2fa`

**Descripción:** Completa el inicio de sesión cuando el usuario tiene el doble factor activado (`login2fa = true`). Valida el código TOTP y emite el JWT definitivo con el claim `2fa: true`.

**Datos de entrada:**
```json
{
  "idUsuario": 1,
  "codigoTotp": "482913"
}
```

**Datos de respuesta:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "idUsuario": 1,
  "nombreUsuario": "jperez",
  "idRol": 3,
  "nombreRol": "Secretaria",
  "login2fa": false
}
```

**Validaciones:**
- idUsuario y codigoTotp obligatorios.
- Verificar que exista una sesión 2FA pendiente en caché (iniciada por un login previo que retornó `login2fa: true`).
- Si la sesión expiró (5 minutos en caché), rechazar con error específico.
- Validar el código TOTP (6 dígitos, 30 segundos, algoritmo SHA1) contra el `totpSecret` del usuario.
- Si el código es inválido o expiró, rechazar la operación sin revelar detalles.
- Emitir el JWT con claim `2fa: true` para indicar que el usuario completó la verificación.
- Limpiar la sesión pendiente de la caché tras verificación exitosa.
- Registrar el login exitoso en Auditoría (operación LOGIN).

---

### 1.5 Activar doble factor para Login

**Dominio de negocio:** Seguridad

**Nombre de operación:** Habilitar2FA

**Endpoint:** `POST /api/auth/2fa/enable`

**Descripción:** Activa la exigencia de 2FA en el Login para el usuario autenticado. No requiere contraseña, solo un JWT válido. Si el usuario aún no ha configurado el autenticador (`totpVerificado = false`), retorna el QR para que lo escanee sin cambiar ningún flag.

**Datos de entrada:**
```json
{}
```

**Datos de respuesta (cuando `totpVerificado = false`):**
```json
{
  "secretoQr": "otpauth://totp/SIGEA:mrodriguez?secret=JBSWY3DPEHPK3PXP&issuer=SIGEA",
  "login2fa": false
}
```

**Datos de respuesta (cuando `totpVerificado = true` y `login2fa = false`):**
```json
{
  "secretoQr": null,
  "login2fa": true
}
```

**Validaciones:**
- Solo requiere autenticación JWT (no pide contraseña).
- Si el usuario tiene `totpVerificado = false`:
  - Retorna el QR del `totpSecret` existente (no regenera el secreto).
  - No cambia `login2fa` ni `totpVerificado`.
- Si el usuario tiene `totpVerificado = true` y `login2fa = false`:
  - Activa `login2fa = true`.
  - A partir del próximo login, se exigirá 2FA.
- Si el usuario ya tiene `login2fa = true`, retorna error "2FA ya activado".
- Registrar la operación en Auditoría (UPDATE sobre tabla Usuario).

---

### 1.6 Recuperar código QR

**Dominio de negocio:** Seguridad

**Nombre de operación:** RecuperarQR

**Endpoint:** `GET /api/auth/2fa/qr`

**Descripción:** Permite al usuario autenticado recuperar el código QR de configuración de Google Authenticator. Solo funciona si el usuario aún no ha verificado el autenticador (`totpVerificado = false`). Una vez verificado, nunca más se retorna el QR.

**Datos de entrada:**
```json
{}
```

**Datos de respuesta (cuando `totpVerificado = false`):**
```json
{
  "qrUri": "otpauth://totp/SIGEA:mrodriguez?secret=JBSWY3DPEHPK3PXP&issuer=SIGEA"
}
```

**Datos de respuesta (cuando `totpVerificado = true`):**
```json
{
  "error": "El autenticador ya fue configurado. No es posible recuperar el QR.",
  "codigo": "TWOFA_ALREADY_VERIFIED"
}
```

**Validaciones:**
- Solo requiere autenticación JWT.
- Si `totpVerificado = true`, rechazar con error (código 409 Conflict).
- Reconstruye la URI del QR a partir del `totpSecret` almacenado (no regenera el secreto).
- No modifica ningún flag del usuario.
- Este endpoint no tiene rate limiting, ya que es de solo lectura.

---

## 2. Gestión de Usuarios, Roles y Permisos

### 2.1 Crear usuario

**Dominio de negocio:** Administración de Usuarios

**Nombre de operación:** CrearUsuario

**Endpoint:** `POST /api/usuarios`

**Descripción:** Registra un nuevo usuario en el sistema, le asigna un rol y genera automáticamente el secreto TOTP para autenticación de doble factor. Operación exclusiva del Superusuario.

**Datos de entrada:**
```json
{
  "usuario": "mrodriguez",
  "password": "Temp@2026!",
  "idRol": 2,
  "nombre": "María",
  "primerApellido": "Rodríguez",
  "numeroDocumento": "87654321"
}
```

**Datos de respuesta:**
```json
{
  "idUsuario": 5,
  "codigo": "USR005",
  "usuario": "mrodriguez",
  "nombre": "María",
  "primerApellido": "Rodríguez",
  "numeroDocumento": "87654321",
  "idRol": 2,
  "nombreRol": "Secretaria",
  "estado": true,
  "login2fa": false,
  "totpVerificado": false,
  "fechaRegistro": "2026-07-11T15:30:00"
}
```

**Validaciones:**
- Solo el Superusuario puede ejecutar esta operación.
- Campo Usuario único (UK), obligatorio, sin caracteres especiales.
- idRol debe existir y estar activo.
- Password cifrado con función hash + salting antes de almacenar.
- Forzar cambio de contraseña en el primer inicio de sesión (recomendado).
- `totpSecret` se genera automáticamente con TotpService (32 bytes, algoritmo SHA1, 6 dígitos, período 30s) y se almacena cifrado con AES con IV aleatorio.
- `login2fa` se inicializa en `false`.
- `totpVerificado` se inicializa en `false`.
- Registrar operación en Auditoría (INSERT sobre tabla Usuario).

---

### 2.2 Editar usuario / Asignar rol

**Dominio de negocio:** Administración de Usuarios

**Nombre de operación:** ActualizarUsuario

**Endpoint:** `PUT /api/usuarios/{id}`

**Descripción:** Modifica los datos de un usuario existente, incluyendo la reasignación de rol y estado.

**Datos de entrada:**
```json
{
  "idUsuario": 5,
  "idRol": 3,
  "estado": true
}
```

**Datos de respuesta:**
```json
{
  "idUsuario": 5,
  "codigo": "USR005",
  "usuario": "mrodriguez",
  "nombre": "María",
  "primerApellido": "Rodríguez",
  "numeroDocumento": "87654321",
  "idRol": 3,
  "nombreRol": "Secretaria",
  "estado": true,
  "login2fa": false,
  "totpVerificado": true,
  "fechaRegistro": "2026-07-11T15:30:00"
}
```

**Validaciones:**
- Solo el Superusuario puede ejecutar esta operación.
- No se permite modificar ni desactivar al Superusuario (regla explícita del documento: no podrá eliminarse).
- idRol debe existir y estar activo.
- Registrar operación en Auditoría (UPDATE) con valorAnterior y valorNuevo.

---

### 2.3 Eliminar usuario (lógico)

**Dominio de negocio:** Administración de Usuarios

**Nombre de operación:** EliminarUsuario

**Endpoint:** `DELETE /api/usuarios/{id}`

**Descripción:** Desactiva lógicamente un usuario (estado = false). No aplica eliminación física.

**Datos de entrada:**
```json
{
  "idUsuario": 5
}
```

**Datos de respuesta:**
```json
{
  "idUsuario": 5,
  "estado": false,
  "mensaje": "Usuario desactivado correctamente"
}
```

**Validaciones:**
- El Superusuario no puede ser eliminado bajo ninguna circunstancia.
- Verificar que el usuario exista.
- Un usuario no puede desactivarse a sí mismo si es el único Superusuario activo (recomendado).
- Registrar operación en Auditoría (operación DELETE lógico).

---

### 2.4 Listar usuarios

**Dominio de negocio:** Administración de Usuarios

**Nombre de operación:** ListarUsuarios

**Endpoint:** `GET /api/usuarios`

**Descripción:** Retorna el listado de usuarios registrados con su rol, permitiendo filtros y paginación.

**Datos de entrada:**
```json
{
  "filtroUsuario": "",
  "idRol": null,
  "estado": true,
  "pagina": 1,
  "tamanioPagina": 20
}
```

**Datos de respuesta:**
```json
{
  "total": 8,
  "content": [
    { "idUsuario": 1, "codigo": "USR001", "usuario": "jperez", "nombre": "Juan", "primerApellido": "Pérez", "idRol": 1, "nombreRol": "Superusuario", "estado": true, "login2fa": false, "totpVerificado": true, "fechaRegistro": "2026-01-05T10:00:00" }
  ]
}
```

**Validaciones:**
- Solo Superusuario tiene acceso a esta pantalla (Director solo consulta según sus permisos asignados).
- Validar que los parámetros de paginación sean numéricos y positivos.
- No exponer el campo password en la respuesta bajo ninguna circunstancia.

---

### 2.5 Crear / Editar rol

**Dominio de negocio:** Administración de Roles

**Nombre de operación:** GuardarRol

**Endpoint:** `POST /api/roles` (crear) / `PUT /api/roles/{id}` (actualizar)

**Descripción:** Crea o actualiza un rol del sistema.

**Datos de entrada:**
```json
{
  "nombre": "Contabilidad"
}
```

**Datos de respuesta:**
```json
{
  "idRol": 5,
  "nombre": "Contabilidad",
  "estado": true
}
```

**Validaciones:**
- `nombre` único (UK), obligatorio, sin espacios, case-insensitive.
- No permitir eliminar ni renombrar el rol Superusuario.
- El backend convierte el nombre a mayúsculas automáticamente.
- Registrar operación en Auditoría (INSERT/UPDATE).

---

### 2.6 Listar funcionalidades (árbol de módulos)

**Dominio de negocio:** Administración de Roles y Permisos

**Nombre de operación:** ListarFuncionalidades

**Endpoint:** `GET /api/funcionalidades`

> **Nota:** El frontend llama a este endpoint al iniciar sesión para construir el menú lateral y verificar permisos de ruta. Retorna el árbol de funcionalidades con los permisos del rol autenticado (extraído del JWT).

**Datos de entrada:**
```json
{}
```

**Datos de respuesta:**
```json
{
  "permisos": [
    {
      "idFuncionalidad": 1,
      "codigo": "SEGURIDAD",
      "nombre": "Seguridad",
      "permisos": { "ver": true, "crear": false, "editar": false, "eliminar": false, "imprimir": false },
      "hijos": [
        { "idFuncionalidad": 2, "codigo": "USUARIOS", "nombre": "Usuarios", "permisos": { "ver": true, "crear": true, "editar": true, "eliminar": false, "imprimir": true }, "hijos": [] },
        { "idFuncionalidad": 3, "codigo": "ROLES", "nombre": "Roles", "permisos": { "ver": true, "crear": true, "editar": true, "eliminar": false, "imprimir": true }, "hijos": [] }
      ]
    }
  ]
}
```

**Validaciones:**
- No requiere rol específico; cualquier usuario autenticado puede consultar sus propios permisos.
- Retorna estructura jerárquica incluyendo los flags de permiso para cada funcionalidad según el rol del usuario autenticado.

---

### 2.7 Asignar permisos por rol

**Dominio de negocio:** Administración de Roles y Permisos

**Nombre de operación:** AplicarPermisos

**Endpoint:** `PUT /api/roles/{idRol}/permisos`

**Descripción:** Guarda de forma masiva los permisos (Ver, Crear, Editar, Eliminar, Imprimir) que un rol tiene sobre cada funcionalidad, mediante checkboxes y el botón "Aplicar".

**Datos de entrada:**
```json
{
  "permisos": [
    { "codigo": "USUARIOS", "ver": true, "crear": true, "editar": true, "eliminar": false, "imprimir": true },
    { "idFuncionalidad": 11, "ver": true, "crear": false, "editar": false, "eliminar": false, "imprimir": false }
  ]
}
```

> El frontend puede enviar `idFuncionalidad` (0 si se desconoce) o `codigo` para identificar la funcionalidad. El backend matchea por `codigo` cuando `idFuncionalidad` es 0 o null.

**Datos de respuesta:**
```json
{
  "idRol": 3,
  "message": "Permisos actualizados correctamente"
}
```

**Validaciones:**
- Control de acceso mediante permiso `ROLES` / `EDITAR` (`@PreAuthorize`).
- El rol SUPERUSUARIO no puede modificarse (retorna `403 ROL_SUPERUSUARIO_BLOQUEADO`).
- idRol debe existir; idFuncionalidad o codigo deben referenciar funcionalidades existentes.
- Operación transaccional: si falla el guardado de un permiso, se debe hacer rollback de todo el conjunto.
- Los permisos no incluidos en el request se desactivan (soft delete en `rol_funcionalidad`).
- Superusuario tiene todos los permisos en `true` por defecto y está bloqueado contra modificaciones.
- Registrar operación en Auditoría (UPDATE sobre Rol_Funcionalidad).

---

### 2.8 Obtener permisos de un rol

**Dominio de negocio:** Administración de Roles y Permisos

**Nombre de operación:** ObtenerPermisosRol

**Endpoint:** `GET /api/roles/{idRol}/permisos`

**Descripción:** Retorna los permisos CRUD+I asignados a un rol específico para cada funcionalidad del sistema. El frontend usa esta respuesta para poblar los checkboxes de la matriz de permisos.

**Datos de entrada:**
```json
{}
```

**Datos de respuesta:**
```json
[
  {
    "idFuncionalidad": 2,
    "codigo": "USUARIOS",
    "ver": true,
    "crear": true,
    "editar": true,
    "eliminar": false,
    "imprimir": false
  },
  {
    "idFuncionalidad": 3,
    "codigo": "ROLES",
    "ver": true,
    "crear": false,
    "editar": false,
    "eliminar": false,
    "imprimir": false
  }
]
```

**Validaciones:**
- Control de acceso mediante permiso `ROLES` / `VER`.
- idRol debe existir.

---

### 2.9 Eliminar rol

**Dominio de negocio:** Administración de Roles

**Nombre de operación:** EliminarRol

**Endpoint:** `DELETE /api/roles/{id}`

**Descripción:** Desactiva lógicamente un rol del sistema (borrado lógico vía campo `estado`).

**Datos de entrada:**
```json
{
  "idRol": 4
}
```

**Datos de respuesta (200 OK):**
```json
{
  "message": "Rol eliminado exitosamente"
}
```

**Datos de respuesta (403 Forbidden — SUPERUSUARIO):**
```json
{
  "error": "ROL_SUPERUSUARIO_NO_ELIMINABLE",
  "message": "El rol SUPERUSUARIO no puede eliminarse"
}
```

**Datos de respuesta (409 Conflict — tiene usuarios):**
```json
{
  "error": "ROL_CON_USUARIOS",
  "message": "El rol tiene 3 usuario(s) asignado(s)",
  "metadata": { "cantidadUsuarios": 3 }
}
```

**Validaciones:**
- El rol SUPERUSUARIO no puede eliminarse (retorna `403 Forbidden`).
- Verificar que no existan usuarios activos asignados al rol antes de desactivarlo (retorna `409 Conflict` con el conteo).
- Registrar operación en Auditoría (DELETE lógico).

---

### 2.10 Obtener usuario por ID

**Dominio de negocio:** Administración de Usuarios

**Nombre de operación:** ObtenerUsuario

**Endpoint:** `GET /api/usuarios/{id}`

**Descripción:** Retorna el detalle completo de un usuario específico por su ID.

**Datos de entrada:**
```json
{
  "idUsuario": 5
}
```

**Datos de respuesta:**
```json
{
  "idUsuario": 5,
  "codigo": "USR005",
  "usuario": "mrodriguez",
  "nombre": "María",
  "primerApellido": "Rodríguez",
  "numeroDocumento": "87654321",
  "idRol": 3,
  "nombreRol": "Secretaria",
  "estado": true,
  "login2fa": false,
  "totpVerificado": true,
  "fechaRegistro": "2026-07-11T15:30:00"
}
```

**Validaciones:**
- Verificar que el usuario exista.
- No exponer el password en la respuesta bajo ninguna circunstancia.

---

## 3. Nivel Académico

### 3.1 Registrar aula

**Dominio de negocio:** Académico

**Nombre de operación:** CrearAula

**Endpoint:** `POST /api/aulas`

**Descripción:** Registra una nueva aula asociada a un año académico, nivel y grado.

**Datos de entrada:**
```json
{
  "codAnioAcademico": 2026,
  "codNivel": 2,
  "codGrado": 1,
  "seccion": "A",
  "capacidadMaxima": 35
}
```

**Datos de respuesta:**
```json
{
  "id": 12,
  "codigo": "AULA-0012",
  "seccion": "A",
  "capacidadMaxima": 35
}
```

**Validaciones:**
- Unique Key sobre (codAnioAcademico, codNivel, codGrado, seccion): no puede existir la misma combinación dos veces (ej. 2026 - Primaria - 1° - A).
- seccion debe ser una letra válida (A, B, C, D...).
- capacidadMaxima debe ser un entero positivo mayor a cero.
- codAnioAcademico, codNivel y codGrado deben existir y estar vigentes.
- Registrar operación en Auditoría (INSERT).

---

### 3.2 Editar aula

**Dominio de negocio:** Académico

**Nombre de operación:** ActualizarAula

**Endpoint:** *No implementado*

**Descripción:** Modifica los datos de un aula existente.

**Datos de entrada:**
```json
{
  "codAula": 12,
  "capacidadMaxima": 40,
  "estado": true
}
```

**Datos de respuesta:** *Operación no implementada*

**Validaciones:**
- No permitir reducir capacidadMaxima por debajo del número de alumnos ya matriculados en esa aula (recomendado).
- Mantener la Unique Key (codAnioAcademico, codNivel, codGrado, seccion) si se editan esos campos.
- Registrar operación en Auditoría (UPDATE) con valorAnterior/valorNuevo.

---

### 3.3 Eliminar aula (lógico)

**Dominio de negocio:** Académico

**Nombre de operación:** EliminarAula

**Endpoint:** `DELETE /api/aulas/{id}`

**Descripción:** Desactiva lógicamente un aula (estado = false).

**Datos de entrada:**
```json
{
  "codAula": 12
}
```

**Datos de respuesta:** *No hay cuerpo de respuesta (HTTP 204 No Content)*

**Validaciones:**
- No permitir desactivar un aula que tenga alumnos matriculados activos en el año académico vigente (recomendado).
- Registrar operación en Auditoría (DELETE lógico).

---

### 3.4 Buscar / listar aulas (Modal)

**Dominio de negocio:** Académico

**Nombre de operación:** BuscarAula

**Endpoint:** `GET /api/aulas`

**Descripción:** Busca aulas disponibles para ser seleccionadas mediante un modal, usada en el proceso de Matrícula.

**Datos de entrada:**
```json
{
  "codAnioAcademico": 2026,
  "codNivel": 2,
  "codGrado": 1,
  "seccion": ""
}
```

**Datos de respuesta:**
```json
[
  { "id": 12, "descripcion": "Primaria - 1° - A", "vacantesDisponibles": 8 }
]
```

**Validaciones:**
- Solo retornar aulas activas.
- Calcular vacantesDisponibles = capacidadMaxima - alumnos matriculados activos.
- El valor máximo de vacantes debe respetar el parámetro configurable de la tabla Parámetro.

---

### 3.5 Registrar alumno

**Dominio de negocio:** Académico

**Nombre de operación:** CrearAlumno

**Endpoint:** `POST /api/alumnos`

**Descripción:** Registra un nuevo alumno en el sistema, cifrando la información crítica.

**Datos de entrada:**
```json
{
  "codTipoDocumento": 1,
  "numeroDocumento": "71234567",
  "nombres": "Ana Lucía",
  "apellidoPaterno": "Torres",
  "apellidoMaterno": "Gómez",
  "fechaNacimiento": "2018-03-15"
}
```

**Datos de respuesta:**
```json
{
  "id": 34,
  "codigo": "ALU-00034",
  "numeroDocumento": "71234567",
  "nombres": "Ana Lucía",
  "apellidoPaterno": "Torres",
  "apellidoMaterno": "Gómez",
  "fechaNacimiento": "2018-03-15"
}
```

**Validaciones:**
- Unique Key sobre (codTipoDocumento, numeroDocumento): no pueden existir dos alumnos con el mismo tipo y número de documento (ej. DNI 71234567).
- nombres, apellidoPaterno y apellidoMaterno son obligatorios, solo texto (sin caracteres especiales ni números).
- fechaNacimiento debe ser una fecha válida y no puede ser una fecha futura.
- numeroDocumento se cifra con AES determinístico (permite búsqueda exacta) y fechaNacimiento con AES con IV aleatorio, conforme a la normativa de protección de datos personales.
- Validar formato de numeroDocumento según codTipoDocumento (ej. DNI 8 dígitos).
- Registrar operación en Auditoría (INSERT), sin exponer en claro los datos cifrados en valorNuevo.

---

### 3.6 Editar alumno

**Dominio de negocio:** Académico

**Nombre de operación:** ActualizarAlumno

**Endpoint:** *No implementado*

**Descripción:** Modifica los datos de un alumno existente.

**Datos de entrada:**
```json
{
  "codAlumno": 34,
  "nombres": "Ana Lucía",
  "apellidoPaterno": "Torres",
  "apellidoMaterno": "Gómez Ríos"
}
```

**Datos de respuesta:** *Operación no implementada*

**Validaciones:**
- Mantener la Unique Key (codTipoDocumento, numeroDocumento) si se modifican esos campos.
- Re-cifrar con AES cualquier campo crítico que se actualice: numeroDocumento con esquema determinístico, fechaNacimiento con IV aleatorio.
- Registrar operación en Auditoría (UPDATE).

---

### 3.7 Eliminar alumno (lógico)

**Dominio de negocio:** Académico

**Nombre de operación:** EliminarAlumno

**Endpoint:** `DELETE /api/alumnos/{id}`

**Descripción:** Desactiva lógicamente a un alumno.

**Datos de entrada:**
```json
{
  "codAlumno": 34
}
```

**Datos de respuesta:** *No hay cuerpo de respuesta (HTTP 204 No Content)*

**Validaciones:**
- No permitir desactivar un alumno con matrícula activa o deudas pendientes (recomendado).
- Registrar operación en Auditoría (DELETE lógico).

---

### 3.8 Buscar alumno (Modal)

**Dominio de negocio:** Académico

**Nombre de operación:** BuscarAlumno

**Endpoint:** `GET /api/alumnos`

**Descripción:** Busca alumnos por nombre o número de documento mediante un modal, usada en Matrícula y Pagos.

**Datos de entrada:**
```json
{
  "criterioBusqueda": "71234567"
}
```

**Datos de respuesta:**
```json
[
  { "id": 34, "numeroDocumento": "71234567", "nombreCompleto": "Ana Lucía Torres Gómez" }
]
```

**Validaciones:**
- Solo retornar alumnos activos.
- Si la búsqueda es por numeroDocumento cifrado con AES determinístico, cifrar el criterio antes de comparar contra la base de datos.
- Enmascarar el número de documento en la respuesta para no exponer datos sensibles en pantalla salvo que el rol tenga permiso explícito.

---

### 3.9 Listar tipos de documento

**Dominio de negocio:** Académico

**Nombre de operación:** ListarTiposDocumento

**Endpoint:** `GET /api/tipos-documento`

**Descripción:** Retorna la lista de tipos de documento disponibles (DNI, Carné de Extranjería, Pasaporte, etc.).

**Datos de entrada:**
```json
{}
```

**Datos de respuesta:**
```json
[
  { "id": 1, "descripcion": "DNI", "estado": true },
  { "id": 2, "descripcion": "Carné de Extranjería", "estado": true }
]
```

**Validaciones:**
- Solo retornar tipos de documento activos.

---

### 3.10 Eliminar tipo de documento

**Dominio de negocio:** Académico

**Nombre de operación:** EliminarTipoDocumento

**Endpoint:** `DELETE /api/tipos-documento/{id}`

**Descripción:** Desactiva lógicamente un tipo de documento.

**Datos de entrada:**
```json
{
  "id": 2
}
```

**Datos de respuesta:** *No hay cuerpo de respuesta (HTTP 204 No Content)*

**Validaciones:**
- No permitir desactivar un tipo de documento que tenga alumnos asociados activos.
- Registrar operación en Auditoría (DELETE lógico).

---

### 3.11 Listar años académicos

**Dominio de negocio:** Académico

**Nombre de operación:** ListarAniosAcademicos

**Endpoint:** `GET /api/anios-academicos`

**Descripción:** Retorna la lista de años académicos registrados en el sistema.

**Datos de entrada:**
```json
{}
```

**Datos de respuesta:**
```json
[
  { "id": 1, "anio": 2025, "estado": false },
  { "id": 2, "anio": 2026, "estado": true }
]
```

**Validaciones:**
- Ninguna.

---

### 3.12 Crear año académico

**Dominio de negocio:** Académico

**Nombre de operación:** CrearAnioAcademico

**Endpoint:** `POST /api/anios-academicos`

**Descripción:** Registra un nuevo año académico en el sistema.

**Datos de entrada:**
```json
{
  "anio": 2027
}
```

**Datos de respuesta:**
```json
{
  "id": 3,
  "anio": 2027,
  "estado": false
}
```

**Validaciones:**
- anio único (UK).
- No puede crear un año académico menor o igual al año actual si ya existe uno registrado para ese año.

---

### 3.13 Activar año académico

**Dominio de negocio:** Académico

**Nombre de operación:** ActivarAnioAcademico

**Endpoint:** `POST /api/anios-academicos/{id}/activar`

**Descripción:** Activa un año académico y desactiva automáticamente el año anterior (solo un año puede estar activo a la vez).

**Datos de entrada:**
```json
{
  "id": 3
}
```

**Datos de respuesta:** *No hay cuerpo de respuesta (HTTP 200 OK sin contenido)*

**Validaciones:**
- El año académico debe existir.
- Desactivar el año académico activo actual antes de activar el nuevo.
- Registrar operación en Auditoría (UPDATE sobre anio_academico).

---

### 3.14 Listar grados

**Dominio de negocio:** Académico

**Nombre de operación:** ListarGrados

**Endpoint:** `GET /api/grados`

**Descripción:** Retorna la lista de grados académicos configurados en el sistema.

**Datos de entrada:**
```json
{}
```

**Datos de respuesta:**
```json
[
  { "id": 1, "nivel": { "id": 1, "nombre": "Primaria", "estado": true }, "nombreGrado": "1°", "estado": true },
  { "id": 2, "nivel": { "id": 1, "nombre": "Primaria", "estado": true }, "nombreGrado": "2°", "estado": true }
]
```

**Validaciones:**
- Solo retornar grados activos.

---

### 3.15 Eliminar grado

**Dominio de negocio:** Académico

**Nombre de operación:** EliminarGrado

**Endpoint:** `DELETE /api/grados/{id}`

**Descripción:** Desactiva lógicamente un grado académico.

**Datos de entrada:**
```json
{
  "id": 2
}
```

**Datos de respuesta:** *No hay cuerpo de respuesta (HTTP 204 No Content)*

**Validaciones:**
- No permitir desactivar un grado que tenga aulas registradas activas.
- Registrar operación en Auditoría (DELETE lógico).

---

### 3.16 Listar niveles

**Dominio de negocio:** Académico

**Nombre de operación:** ListarNiveles

**Endpoint:** `GET /api/niveles`

**Descripción:** Retorna la lista de niveles educativos configurados en el sistema.

**Datos de entrada:**
```json
{}
```

**Datos de respuesta:**
```json
[
  { "id": 1, "nombre": "Inicial", "estado": true },
  { "id": 2, "nombre": "Primaria", "estado": true }
]
```

**Validaciones:**
- Solo retornar niveles activos.

---

### 3.17 Eliminar nivel

**Dominio de negocio:** Académico

**Nombre de operación:** EliminarNivel

**Endpoint:** `DELETE /api/niveles/{id}`

**Descripción:** Desactiva lógicamente un nivel educativo.

**Datos de entrada:**
```json
{
  "id": 2
}
```

**Datos de respuesta:** *No hay cuerpo de respuesta (HTTP 204 No Content)*

**Validaciones:**
- No permitir desactivar un nivel que tenga aulas registradas activas.
- Registrar operación en Auditoría (DELETE lógico).

---

## 4. Nivel Financiero (Tarifario, Matrícula y Pagos)

### 4.1 Registrar concepto (tarifario)

**Dominio de negocio:** Financiero

**Nombre de operación:** CrearConcepto

**Endpoint:** `POST /api/conceptos`

**Descripción:** Registra un concepto de pago (ej. Matrícula, Marzo, Abril) asociado a un año académico.

**Datos de entrada:**
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

**Datos de respuesta:**
```json
{
  "id": 7,
  "nombreConcepto": "Matrícula",
  "monto": 350.00,
  "ordenPago": 1,
  "obligatorio": true,
  "version": 1
}
```

**Validaciones:**
- Unique Key sobre (codAnioAcademico, nombreConcepto): no puede repetirse el mismo concepto en el mismo año.
- monto debe ser mayor que cero.
- ordenPago debe ser un entero positivo y define la secuencia de pago (no se puede pagar una cuota de orden superior sin cancelar las anteriores).
- codTipoConcepto debe existir.
- version inicia en 1 para control de Optimistic Lock.
- Registrar operación en Auditoría (INSERT).

---

### 4.2 Editar concepto (con Optimistic Lock)

**Dominio de negocio:** Financiero

**Nombre de operación:** ActualizarConcepto

**Endpoint:** `PUT /api/conceptos/{id}`

**Descripción:** Modifica un concepto existente validando control de concurrencia mediante versión.

**Datos de entrada:**
```json
{
  "codConcepto": 7,
  "monto": 380.00,
  "version": 1
}
```

**Datos de respuesta:**
```json
{
  "id": 7,
  "nombreConcepto": "Matrícula",
  "monto": 380.00,
  "ordenPago": 1,
  "obligatorio": true,
  "version": 2
}
```

**Validaciones:**
- La version enviada debe coincidir con la version almacenada; si no coincide, la operación se rechaza (código de conflicto 409) devolviendo el registro actual del servidor con su nueva version, sin sobrescribir ni reintentar automáticamente.
- El cliente debe refrescar la pantalla con los datos devueltos por el servidor antes de permitir un nuevo intento de guardado.
- monto debe ser mayor que cero.
- Incrementar version en 1 tras una actualización exitosa.
- Registrar operación en Auditoría (UPDATE) con valorAnterior/valorNuevo.

---

### 4.3 Clonar conceptos de un año a otro

**Dominio de negocio:** Financiero

**Nombre de operación:** ClonarConceptos

**Endpoint:** `POST /api/conceptos/clonar`

**Descripción:** Copia el tarifario de conceptos de un año académico origen hacia un año académico destino.

**Datos de entrada:**
```json
{
  "codAnioAcademicoOrigen": 2025,
  "codAnioAcademicoDestino": 2026
}
```

**Datos de respuesta:**
```json
{
  "conceptosClonados": 10,
  "anioDestino": 2026
}
```

**Validaciones:**
- El año académico destino no debe tener ya conceptos con el mismo nombreConcepto (respetar la Unique Key).
- El año académico origen debe existir y tener al menos un concepto activo.
- Operación transaccional: si falla la clonación de un concepto, se revierte toda la operación (rollback completo).
- Registrar operación en Auditoría (operación tipo INSERT masivo).

---

### 4.4 Registrar matrícula

**Dominio de negocio:** Financiero / Académico

**Nombre de operación:** RegistrarMatricula

**Endpoint:** `POST /api/matriculas`

**Descripción:** Matricula a un alumno en un aula para un año académico, generando automáticamente las cuotas asociadas a los conceptos vigentes. Requiere doble factor de autenticación (Google Authenticator). El código OTP se valida contra el `totpSecret` del usuario autenticado (operador).

**Datos de entrada (Fase 1 — primera vez o sin QR configurado):**
```json
{
  "codAnioAcademico": 2026,
  "codAula": 12,
  "codAlumno": 34
}
```

**Datos de respuesta (cuando `totpVerificado = false`):**
```json
{
  "id": null,
  "codigo": null,
  "codAlumno": null,
  "codAula": null,
  "codAnioAcademico": null,
  "fechaMatricula": null,
  "cuotas": null,
  "requiresQrSetup": true,
  "qrUri": "otpauth://totp/SIGEA:mrodriguez?secret=JBSWY3DPEHPK3PXP&issuer=SIGEA"
}
```

**Datos de entrada (Fase 2 — con código OTP):**
```json
{
  "codAnioAcademico": 2026,
  "codAula": 12,
  "codAlumno": 34,
  "codigoOTP": "482913"
}
```

**Datos de respuesta (matrícula exitosa):**
```json
{
  "id": 101,
  "codigo": "MAT-2026-0101",
  "codAlumno": 34,
  "codAula": 12,
  "codAnioAcademico": 2026,
  "fechaMatricula": "2026-07-11T15:30:00",
  "cuotas": [
    { "id": 201, "codConcepto": 7, "montoPagar": 380.00, "ordenPago": 1, "estadoCuota": "PENDIENTE" },
    { "id": 202, "codConcepto": 8, "montoPagar": 300.00, "ordenPago": 2, "estadoCuota": "PENDIENTE" }
  ]
}
```

**Validaciones:**
- El usuario autenticado debe tener el `totpSecret` generado (se crea automáticamente al registrar el usuario).
- Si `totpVerificado = false` y `codigoOTP` es null o vacío:
  - Retorna el código QR para que el usuario escanee con Google Authenticator.
  - No procesa la matrícula.
- Si `totpVerificado = false` y `codigoOTP` está presente:
  - Validar el código OTP contra el `totpSecret` del usuario autenticado.
  - Si el código es válido, establecer `totpVerificado = true` y continuar con la matrícula.
- Si `totpVerificado = true` y `codigoOTP` está presente:
  - Validar el código OTP contra el `totpSecret` del usuario autenticado.
  - Si es válido, continuar con la matrícula.
- Si `totpVerificado = true` y `codigoOTP` es null o vacío:
  - Rechazar con error: "Debe ingresar el código de verificación OTP."
- Máximo 3 intentos fallidos de validación de `codigoOTP`; al superarlos, bloquear la operación de Matrícula para ese usuario durante 5 minutos (cache Caffeine).
- El flag `login2fa` del usuario nunca se modifica durante este proceso.
- El QR se retorna solo una vez: antes de que `totpVerificado` cambie a `true`. Una vez verificado, el QR no se vuelve a mostrar.
- El Aula debe existir y estar activa.
- El Alumno debe existir y estar activo.
- El Alumno no debe estar ya matriculado en ese mismo año académico.
- El Aula debe tener vacantes disponibles (según capacidadMaxima y el parámetro configurable de vacantes máximas).
- El Alumno no debe tener deudas pendientes de años anteriores, si esta regla de negocio está habilitada.
- Deben existir conceptos activos para el año académico seleccionado.
- Operación transaccional (Matrícula → Generar Cuotas → Forzar incremento de versión de Aula → Commit); ante cualquier error, rollback completo sin dejar información parcial. No se modifican campos de negocio de Aula; el incremento de `@Version` se fuerza mediante `OPTIMISTIC_FORCE_INCREMENT` para detectar colisiones de concurrencia.
- Registrar operación en Auditoría (operación MATRÍCULA).

---

### 4.5 Consultar deudas / cuotas de un alumno

**Dominio de negocio:** Financiero

**Nombre de operación:** ConsultarDeudas

**Endpoint:** `GET /api/pagos/deudas`

**Descripción:** Muestra la lista de cuotas pendientes y pagadas de un alumno para un año académico.

**Datos de entrada:**
```json
{
  "codAnioAcademico": 2026,
  "codAlumno": 34
}
```

**Datos de respuesta:**
```json
[
  { "codCuota": 201, "codMatricula": 101, "montoPagar": 380.00, "ordenPago": 1, "estadoCuota": "PAGADA" },
  { "codCuota": 202, "codMatricula": 101, "montoPagar": 300.00, "ordenPago": 2, "estadoCuota": "PENDIENTE" }
]
```

**Validaciones:**
- El Alumno debe existir y estar matriculado en el año académico consultado.
- Ordenar las cuotas según ordenPago para reflejar la secuencia de pago obligatoria.

---

### 4.6 Registrar pago

**Dominio de negocio:** Financiero

**Nombre de operación:** RegistrarPago

**Endpoint:** `POST /api/pagos`

**Descripción:** Registra el pago de una cuota pendiente, genera el recibo correspondiente y actualiza el correlativo.

**Datos de entrada:**
```json
{
  "codCuota": 202,
  "montoPagado": 300.00,
  "medioPago": "EFECTIVO"
}
```

**Datos de respuesta:**
```json
{
  "codPago": 45,
  "codCuota": 202,
  "numeroRecibo": "R-2026-000045",
  "montoPagado": 300.00,
  "medioPago": "EFECTIVO",
  "fechaPago": "2026-07-11T15:45:00"
}
```

**Validaciones:**
- La cuota debe existir y estar en estado PENDIENTE.
- No se puede pagar una cuota si existen cuotas anteriores (menor ordenPago) aún pendientes.
- montoPagado debe ser igual al monto de la cuota (o validar pagos parciales si el negocio lo permite).
- El correlativo del recibo es único y consecutivo por año académico (reinicia en 1 al iniciar cada año); su actualización debe ser atómica para evitar duplicados por concurrencia.
- Operación transaccional (Generar Recibo → Actualizar Correlativo → Marcar Cuota como Pagada → Registrar Auditoría → Commit); ante error, rollback completo.
- Registrar operación en Auditoría (operación PAGO).

---

### 4.7 Listar conceptos

**Dominio de negocio:** Financiero

**Nombre de operación:** ListarConceptos

**Endpoint:** `GET /api/conceptos`

**Descripción:** Retorna la lista de conceptos de pago registrados para el año académico activo.

**Datos de entrada:**
```json
{}
```

**Datos de respuesta:**
```json
[
  { "id": 7, "nombreConcepto": "Matrícula", "monto": 380.00, "ordenPago": 1, "obligatorio": true, "version": 2 }
]
```

**Validaciones:**
- Ninguna.

---

### 4.8 Eliminar concepto

**Dominio de negocio:** Financiero

**Nombre de operación:** EliminarConcepto

**Endpoint:** `DELETE /api/conceptos/{id}`

**Descripción:** Desactiva lógicamente un concepto de pago.

**Datos de entrada:**
```json
{
  "codConcepto": 7
}
```

**Datos de respuesta:** *No hay cuerpo de respuesta (HTTP 204 No Content)*

**Validaciones:**
- No permitir desactivar un concepto que tenga cuotas asociadas en estado PENDIENTE o PAGADA.
- Registrar operación en Auditoría (DELETE lógico).

---

### 4.9 Crear tipo de concepto

**Dominio de negocio:** Financiero

**Nombre de operación:** CrearTipoConcepto

**Endpoint:** `POST /api/tipos-concepto`

**Descripción:** Registra un nuevo tipo de concepto para clasificar los conceptos de pago.

**Datos de entrada:**
```json
{
  "nombre": "Pensión"
}
```

**Datos de respuesta:**
```json
{
  "id": 3,
  "nombre": "Pensión",
  "estado": true
}
```

**Validaciones:**
- nombre único (UK) y obligatorio.
- Registrar operación en Auditoría (INSERT).

---

### 4.10 Listar tipos de concepto

**Dominio de negocio:** Financiero

**Nombre de operación:** ListarTiposConcepto

**Endpoint:** `GET /api/tipos-concepto`

**Descripción:** Retorna la lista de tipos de concepto disponibles en el sistema.

**Datos de entrada:**
```json
{}
```

**Datos de respuesta:**
```json
[
  { "id": 1, "nombre": "Matrícula", "estado": true },
  { "id": 2, "nombre": "Pensión", "estado": true }
]
```

**Validaciones:**
- Solo retornar tipos de concepto activos.

---

### 4.11 Actualizar tipo de concepto

**Dominio de negocio:** Financiero

**Nombre de operación:** ActualizarTipoConcepto

**Endpoint:** `PUT /api/tipos-concepto/{id}`

**Descripción:** Modifica el nombre de un tipo de concepto existente.

**Datos de entrada:**
```json
{
  "id": 2,
  "nombre": "Pensión Mensual"
}
```

**Datos de respuesta:**
```json
{
  "id": 2,
  "nombre": "Pensión Mensual",
  "estado": true
}
```

**Validaciones:**
- nombre único (UK).
- Registrar operación en Auditoría (UPDATE).

---

### 4.12 Eliminar tipo de concepto

**Dominio de negocio:** Financiero

**Nombre de operación:** EliminarTipoConcepto

**Endpoint:** `DELETE /api/tipos-concepto/{id}`

**Descripción:** Desactiva lógicamente un tipo de concepto.

**Datos de entrada:**
```json
{
  "id": 2
}
```

**Datos de respuesta:** *No hay cuerpo de respuesta (HTTP 204 No Content)*

**Validaciones:**
- No permitir desactivar un tipo de concepto que tenga conceptos activos asociados.
- Registrar operación en Auditoría (DELETE lógico).

---

## 5. Auditoría

### 5.1 Consultar historial de auditoría

**Dominio de negocio:** Auditoría

**Nombre de operación:** ConsultarAuditoria

**Endpoint:** `GET /api/reportes/auditoria`

**Descripción:** Permite consultar el historial de operaciones registradas sobre cualquier módulo del sistema (INSERT, UPDATE, DELETE, LOGIN, LOGIN_FAILED, LOGOUT, PAGO, MATRÍCULA, etc.).

**Datos de entrada:**
```json
{
  "codUsuario": null,
  "modulo": "Alumno",
  "desde": "2026-07-01T00:00:00Z",
  "hasta": "2026-07-11T23:59:59Z"
}
```

**Datos de respuesta:**
```json
[
  {
    "id": 501,
    "codUsuario": 1,
    "modulo": "Alumno",
    "operacion": "INSERT",
    "codigoRegistro": "34",
    "fechaHora": "2026-07-11T15:30:00Z",
    "ipOrigen": "192.168.1.20"
  }
]
```

**Validaciones:**
- El acceso es exclusivo del Superusuario; ningún otro rol (incluido Director, aunque tenga permisos de consulta en otros módulos) puede acceder a esta operación.
- desde no puede ser posterior a hasta.
- Esta operación es únicamente de lectura; no debe permitir modificar ni eliminar registros de auditoría bajo ninguna circunstancia.
- El registro de auditoría (INSERT interno) debe ejecutarse automáticamente en cada operación de negocio (login, CRUD, matrícula, pago) dentro de la misma transacción, capturando usuario, fecha/hora del servidor, IP de origen y valores anterior/nuevo en JSON.

---

## 6. Parámetros del Sistema

### 6.1 Obtener parámetro

**Dominio de negocio:** Configuración

**Nombre de operación:** ObtenerParametro

**Endpoint:** `GET /api/parametros/{clave}`

**Descripción:** Obtiene el valor de un parámetro de configuración del sistema por su clave.

**Datos de entrada:**
```json
{
  "clave": "VACANTES_MAXIMAS_POR_AULA"
}
```

**Datos de respuesta:**
```json
{
  "clave": "VACANTES_MAXIMAS_POR_AULA",
  "valor": "35"
}
```

**Validaciones:**
- La clave debe existir en la tabla Parámetro.

---

### 6.2 Actualizar parámetro

**Dominio de negocio:** Configuración

**Nombre de operación:** ActualizarParametro

**Endpoint:** `PUT /api/parametros/{clave}`

**Descripción:** Actualiza el valor de un parámetro de configuración del sistema.

**Datos de entrada:**
```json
{
  "clave": "VACANTES_MAXIMAS_POR_AULA",
  "valor": "40"
}
```

**Datos de respuesta:**
```json
{
  "clave": "VACANTES_MAXIMAS_POR_AULA",
  "valor": "40",
  "mensaje": "Parámetro actualizado correctamente"
}
```

**Validaciones:**
- La clave debe existir en la tabla Parámetro.
- Registrar operación en Auditoría (UPDATE sobre tabla Parametro).

---

### 6.3 Eliminar parámetro

**Dominio de negocio:** Configuración

**Nombre de operación:** EliminarParametro

**Endpoint:** `DELETE /api/parametros/{clave}`

**Descripción:** Elimina un parámetro de configuración del sistema.

**Datos de entrada:**
```json
{
  "clave": "VACANTES_MAXIMAS_POR_AULA"
}
```

**Datos de respuesta:** *No hay cuerpo de respuesta (HTTP 204 No Content)*

**Validaciones:**
- La clave debe existir en la tabla Parámetro.
- No permitir eliminar parámetros críticos para el funcionamiento del sistema (recomendado).
- Registrar operación en Auditoría (DELETE lógico).

---

## 7. Reportes

### 7.1 Reporte de matrículas

**Dominio de negocio:** Reportes

**Nombre de operación:** ReporteMatriculas

**Endpoint:** `GET /api/reportes/matriculas`

**Descripción:** Genera un reporte de matrículas registradas, con filtros opcionales por año académico, nivel, grado y aula.

**Datos de entrada:**
```json
{
  "anioAcademico": 2026,
  "codNivel": 2,
  "codGrado": 1,
  "codAula": 12
}
```

**Datos de respuesta:**
```json
[
  {
    "id": 101,
    "codAlumno": 34,
    "codAula": 12,
    "codAnioAcademico": 2026,
    "fechaMatricula": "2026-07-11T15:30:00"
  }
]
```

**Validaciones:**
- Control de acceso mediante permiso REPORTE / VER.
- Los filtros son opcionales; si no se envían, retorna todas las matrículas.

---

### 7.2 Reporte de pagos

**Dominio de negocio:** Reportes

**Nombre de operación:** ReportePagos

**Endpoint:** `GET /api/reportes/pagos`

**Descripción:** Genera un reporte de pagos realizados en un rango de fechas, incluyendo el total recaudado.

**Datos de entrada:**
```json
{
  "desde": "2026-07-01T00:00:00",
  "hasta": "2026-07-11T23:59:59"
}
```

**Datos de respuesta:**
```json
{
  "totalRecaudado": 15000.00,
  "cantidadPagos": 45,
  "detalle": [
    { "codPago": 45, "codCuota": 202, "montoPagado": 300.00, "medioPago": "EFECTIVO", "fechaPago": "2026-07-11T15:45:00" }
  ]
}
```

**Validaciones:**
- Control de acceso mediante permiso REPORTE / VER.
- desde y hasta son obligatorios.
- desde no puede ser posterior a hasta.

---

### 7.3 Reporte de deudas

**Dominio de negocio:** Reportes

**Nombre de operación:** ReporteDeudas

**Endpoint:** `GET /api/reportes/deudas`

**Descripción:** Genera un reporte de todos los alumnos con deudas pendientes, incluyendo el monto total adeudado y la cantidad de cuotas.

**Datos de entrada:**
```json
{}
```

**Datos de respuesta:**
```json
[
  { "codAlumno": 34, "montoAdeudado": 300.00, "cantidadCuotas": 1 },
  { "codAlumno": 35, "montoAdeudado": 680.00, "cantidadCuotas": 2 }
]
```

**Validaciones:**
- Control de acceso mediante permiso REPORTE / VER.
- Solo retornar alumnos con al menos una cuota en estado PENDIENTE o BLOQUEADA.

---

### 7.4 Reporte de vacantes

**Dominio de negocio:** Reportes

**Nombre de operación:** ReporteVacantes

**Endpoint:** `GET /api/reportes/vacantes`

**Descripción:** Genera un reporte de vacantes disponibles por aula, con filtros opcionales por año académico, nivel y grado.

**Datos de entrada:**
```json
{
  "anioAcademico": 2026,
  "nivel": 2,
  "grado": 1
}
```

**Datos de respuesta:**
```json
[
  { "codAula": 12, "descripcion": "Primaria - 1° - A", "anioAcademico": 2026, "nivel": "Primaria", "grado": "1°", "seccion": "A", "capacidadMaxima": 35, "matriculados": 27, "vacantesDisponibles": 8 }
]
```

**Validaciones:**
- Control de acceso mediante permiso REPORTE / VER.
- vacantesDisponibles = capacidadMaxima - matriculados.
- Los filtros son opcionales.

---

## 8. Criptografía

### 8.1 Intercambio de llaves ECDH

**Dominio de negocio:** Seguridad / Criptografía

**Nombre de operación:** KeyExchange

**Endpoint:** `POST /api/crypto/key-exchange`

**Descripción:** Inicia un intercambio de llaves ECDH (curva secp256r1) entre el cliente y el servidor para establecer una clave de sesión compartida. El servidor recibe la clave pública del cliente, genera su propio par de llaves, calcula el secreto compartido y retorna su clave pública junto con un identificador de sesión. La clave compartida se usa para cifrado envelope de datos sensibles en tránsito.

**Datos de entrada:**
```json
{
  "clientPublicKey": "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE..."
}
```

**Datos de respuesta:**
```json
{
  "sessionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "serverPublicKey": "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE...",
  "expiraEnSegundos": 300
}
```

**Validaciones:**
- Endpoint público (no requiere autenticación).
- clientPublicKey debe ser una clave pública válida en formato SPKI (X.509) Base64, curva secp256r1.
- La sesión generada expira en 5 minutos.
- La clave pública del servidor se genera por request (ephemeral key).
- El secreto compartido se deriva usando ECDH con el esquema de acuerdo de llaves NIST SP 800-56A.
- Registrar el intercambio en Auditoría (operación KEY_EXCHANGE, sin exponer las claves).
