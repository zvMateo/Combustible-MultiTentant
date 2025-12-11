# Documentación API Combustibles Ubiko

**Versión:** v1\
**Base URL:** `https://apicombustibles.ubiko.com.ar`\
**Especificación:** OAS 3.0\
**Formato de Respuesta:** JSON

------------------------------------------------------------------------

## 🔐 Autenticación y Autorización

La API está protegida mediante **JWT (JSON Web Token)**. Para realizar
peticiones a los endpoints protegidos, es necesario incluir el token en
el encabezado `Authorization`.

**Header Requerido:**\
`Authorization: Bearer <tu_token_de_acceso>`

### Iniciar Sesión (Login)

Obtiene el token de acceso para operar en el sistema.

-   **Endpoint:** `POST /api/Auth/Login`
-   **Cuerpo (JSON):**

``` json
{
  "userName": "usuario",
  "password": "password123"
}
```

**Respuesta Exitosa (200 OK):**

``` json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI...",
  "expiration": "2025-12-10T17:37:05Z",
  "user": "NombreUsuario"
}
```

------------------------------------------------------------------------

# 🏢 Estructura Organizacional

## Empresas (Companies)

Gestión de las entidades principales (empresas cliente).

  -----------------------------------------------------------------------------------
  Método       Endpoint                     Descripción          Parámetros
  ------------ ---------------------------- -------------------- --------------------
  GET          /api/Companies/GetAll        Listar todas las     \-
                                            empresas             

  GET          /api/Companies/GetById       Obtener una empresa  id={int}

  POST         /api/Companies/Create        Crear empresa        Body: { "name":
                                                                 "...", "detail":
                                                                 "..." }

  PUT          /api/Companies/Update        Actualizar empresa   Body JSON

  PATCH        /api/Companies/Desactivate   Desactivar empresa   id={int}
  -----------------------------------------------------------------------------------

------------------------------------------------------------------------

## Unidades de Negocio (BusinessUnits)

Sucursales o divisiones dentro de una empresa.

  ------------------------------------------------------------------------------------------
  Método       Endpoint                            Descripción          Parámetros
  ------------ ----------------------------------- -------------------- --------------------
  GET          /api/BusinessUnits/GetAll           Listar todas         \-

  GET          /api/BusinessUnits/GetById          Obtener por ID       id={int}

  GET          /api/BusinessUnits/GetByIdCompany   Listar por Empresa   idCompany={int}

  POST         /api/BusinessUnits/Create           Crear unidad         Body JSON

  PUT          /api/BusinessUnits/Update           Actualizar unidad    Body JSON

  PATCH        /api/BusinessUnits/Desactivate      Desactivar unidad    id={int}
  ------------------------------------------------------------------------------------------

------------------------------------------------------------------------

# 🚛 Gestión de Recursos (Activos)

## Recursos (Resource)

Representa Tanques, Surtidores o Vehículos.

### Endpoint Principal

`GET /api/Resource/GetAll`

**Ejemplo de Respuesta:**

``` json
[
  {
    "id": 1,
    "idType": 1,
    "type": ["Tanque"],
    "company": ["Grupo Color"],
    "name": "Tanque del campo",
    "identifier": "TC221",
    "nativeLiters": 10,
    "active": true
  },
  {
    "id": 4,
    "idType": 5,
    "type": ["Vehiculo"],
    "name": "camion",
    "identifier": "cv 250",
    "nativeLiters": 240,
    "active": true
  }
]
```

  -------------------------------------------------------------------------------------
  Método       Endpoint                       Descripción          Parámetros
  ------------ ------------------------------ -------------------- --------------------
  GET          /api/Resource/GetById          Obtener recurso      id={int}

  GET          /api/Resource/GetByIdType      Filtrar por tipo     IdType={int}

  GET          /api/Resource/GetByIdCompany   Filtrar por empresa  IdCompany={int}

  POST         /api/Resource/Create           Crear recurso        Body JSON

  PUT          /api/Resource/Update           Actualizar recurso   Body JSON

  PATCH        /api/Resource/Deactivate       Desactivar           id={int}
  -------------------------------------------------------------------------------------

------------------------------------------------------------------------

## Tipos de Recursos (ResourceTypes)

Configuración de tipos (ej: Tanque, Vehículo).\
Endpoints: **GetAll, GetById, Create, Update, Deactivate**\
Esquema básico:

``` json
{ "name": "string" }
```

------------------------------------------------------------------------

# 👤 Conductores (Drivers)

### Endpoint Principal

`GET /api/Drivers/GetAll`

**Ejemplo de Respuesta:**

``` json
[
  {
    "id": 3,
    "idCompany": 2,
    "name": "Mateo",
    "dni": "44471822",
    "phoneNumber": "3573401261",
    "active": true
  }
]
```

  ------------------------------------------------------------------------------------
  Método       Endpoint                      Descripción          Parámetros
  ------------ ----------------------------- -------------------- --------------------
  GET          /api/Drivers/GetById          Obtener conductor    id={int}

  GET          /api/Drivers/GetByIdCompany   Filtrar por empresa  idCompany={int}

  POST         /api/Drivers/Create           Crear conductor      Body JSON

  PUT          /api/Drivers/Update           Actualizar           Body JSON

  PATCH        /api/Drivers/Deactivate       Desactivar           id={int}
  ------------------------------------------------------------------------------------

------------------------------------------------------------------------

# ⛽ Operaciones de Combustible

## Carga de Litros (LoadLiters)

### Crear Carga

`POST /api/LoadLiters/Create`

``` json
{
  "idResource": 0,
  "idFuelType": 0,
  "loadDate": "2025-12-10T17:40:00Z",
  "initialLiters": 0,
  "finalLiters": 0,
  "totalLiters": 50,
  "detail": "Carga manual"
}
```

### Asociar Carga a Viaje

`POST /api/LoadLiters/AssociateLoadTrip`

``` json
{
  "idTrip": 0,
  "idLoadLiters": 0,
  "totalLiters": 0,
  "detail": "string"
}
```

### Otros Endpoints

  Método   Endpoint                      Descripción
  -------- ----------------------------- ----------------------
  GET      /api/LoadLiters/GetAll        Ver historial
  GET      /api/LoadLiters/GetById       Ver detalle
  GET      /api/LoadLiters/GetByIdTrip   Ver cargas por viaje
  PUT      /api/LoadLiters/Update        Corregir datos

------------------------------------------------------------------------

## Movimientos de Stock (FuelStockMovement)

  ------------------------------------------------------------------------------------------
  Método         Endpoint                        Descripción             Ejemplo
  -------------- ------------------------------- ----------------------- -------------------
  GET            /api/FuelStockMovement/GetAll   Ver movimientos         \-

  POST           /api/FuelStockMovement/Create   Registrar movimiento    { "idFuelType": 0,
                                                                         "idResource": 0,
                                                                         "liters": 1000,
                                                                         "idMovementType": 0
                                                                         }

  PUT            /api/FuelStockMovement/Update   Corregir movimiento     Body JSON
  ------------------------------------------------------------------------------------------

------------------------------------------------------------------------

## Tipos de Combustible (FuelTypes)

Endpoints: **GetAll, GetById, Create, Update, Deactivate**\
Ejemplos: Nafta, Diesel, Euro, GNC.

## Tipos de Movimiento (MovementTypes)

Endpoints: **GetAll, GetById, Create, Update, Deactivate**\
Ejemplos: Compra, Descarga, Ajuste de Stock.

------------------------------------------------------------------------

# 📍 Viajes (Trips)

  ------------------------------------------------------------------------------------
  Método       Endpoint                   Descripción         Body / Params
  ------------ -------------------------- ------------------- ------------------------
  GET          /api/Trips/GetAll          Ver todos           \-

  GET          /api/Trips/GetById         Ver un viaje        id={int}

  GET          /api/Trips/GetByIdDriver   Viajes de un chofer idDriver={int}

  POST         /api/Trips/Create          Registrar viaje     { "idDriver": 0,
                                                              "initialLocation":
                                                              "...", "finalLocation":
                                                              "...", "totalKm": 100 }

  PUT          /api/Trips/Update          Actualizar viaje    Body JSON
  ------------------------------------------------------------------------------------

------------------------------------------------------------------------

# 🤖 Integraciones y Automatización

## Endpoints N8n

    GET /api/N8n/GetCompanies
    GET /api/N8n/GetBusinessUnits
    GET /api/N8n/GetDrivers
    GET /api/N8n/GetResources
    GET /api/N8n/GetTrips
    GET /api/N8n/GetLoadLiters
    GET /api/N8n/GetFuelStockMovement
    GET /api/N8n/GetWhiteList
    POST /api/N8n/CreateLoadLiter

------------------------------------------------------------------------

## Lista Blanca IA (IaWhiteList)

  -------------------------------------------------------------------------------
  Método             Endpoint                       Descripción
  ------------------ ------------------------------ -----------------------------
  GET                /api/IaWhiteList/GetAll        Listar permitidos (IdCompany,
                                                    IdBusinessUnit)

  POST               /api/IaWhiteList/Create        Agregar a whitelist

  PATCH              /api/IaWhiteList/Desactivate   Bloquear número
  -------------------------------------------------------------------------------

------------------------------------------------------------------------

# 🛠️ Administración de Usuarios

## Usuarios (Users)

    GET /api/Users/GetAllUsers
    GET /api/Users/GetUserByUserId/{UserId}
    POST /api/Users/AddUser
    PUT /api/Users/UpdateUser/{Id_User}
    PUT /api/Users/{Id_User}/ChangePassword

## Roles y Permisos (Roles & UserRoles)

    GET /api/Roles/GetAllRoles
    POST /api/Roles/AddRole
    DELETE /api/Roles/DeleteRole/{RoleId}
    GET /api/UserRoles/GetUserRolesByUserId/{UserId}
    POST /api/UserRoles/AddUserRoles/{UserId}
