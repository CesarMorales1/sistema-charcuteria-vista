# Sistema de Gestión - Charcutería

Aplicación React para control integral de inventario, compras, proveedores y cuentas por pagar.

## Características

- **Login y Registro de Usuarios**
- **Dashboard Principal** con acceso a módulos:
  - Inventario
  - Compras
  - Proveedores
  - Facturación
  - Tasas de cambio
  - Usuarios
- **Autenticación JWT**
- **Diseño profesional** inspirado en la imagen proporcionada
- **Preparado para Electron** (conversión a aplicación de escritorio)

## Instalación

```bash
npm install
```

## Configuración

1. Copia el archivo `.env.example` a `.env`:
```bash
cp .env.example .env
```

2. Configura la URL del backend en `.env`:
```
VITE_API_URL=http://localhost:3000/api
```

## Ejecución en Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## Construcción para Producción

```bash
npm run build
```

## Credenciales de Prueba

Usuario administrador por defecto:
- Email: `admin@charcuteria.com`
- Contraseña: `admin`

## Estructura del Proyecto

```
src/
├── components/         # Componentes reutilizables
│   └── ProtectedRoute.tsx
├── context/           # Context API para estado global
│   └── AuthContext.tsx
├── pages/             # Páginas de la aplicación
│   ├── Login.tsx
│   ├── Register.tsx
│   └── Dashboard.tsx
├── services/          # Servicios para llamadas a la API
│   └── api.ts
├── App.tsx           # Componente principal y rutas
└── main.tsx          # Punto de entrada
```

## Conversión a Aplicación de Escritorio con Electron

Para convertir esta aplicación en una aplicación de escritorio:

### 1. Instalar dependencias de Electron

```bash
npm install --save-dev electron electron-builder concurrently wait-on cross-env
```

### 2. Crear archivo `electron.cjs` en la raíz del proyecto

```javascript
const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // En desarrollo
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // En producción
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
```

### 3. Actualizar `package.json`

Agregar los siguientes scripts:

```json
{
  "main": "electron.cjs",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "electron": "electron .",
    "electron:dev": "concurrently \"npm run dev\" \"wait-on http://localhost:5173 && cross-env NODE_ENV=development electron .\"",
    "electron:build": "npm run build && electron-builder"
  },
  "build": {
    "appId": "com.charcuteria.sistema",
    "productName": "Sistema de Gestión",
    "files": [
      "dist/**/*",
      "electron.cjs"
    ],
    "directories": {
      "buildResources": "assets"
    },
    "win": {
      "target": "nsis"
    },
    "mac": {
      "target": "dmg"
    },
    "linux": {
      "target": "AppImage"
    }
  }
}
```

### 4. Ejecutar en modo desarrollo con Electron

```bash
npm run electron:dev
```

### 5. Compilar aplicación de escritorio

```bash
npm run electron:build
```

Esto generará los instaladores en la carpeta `dist` según tu sistema operativo.

## API Backend

La aplicación se conecta a una API backend con las siguientes rutas principales:

- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Obtener perfil de usuario
- `POST /api/usuarios` - Crear usuario
- `GET /api/proveedores` - Listar proveedores
- `POST /api/compras` - Crear compra
- `GET /api/inventario/productos` - Listar productos
- `POST /api/facturas` - Crear factura
- `POST /api/tasas` - Registrar tasa de cambio

Ver documentación completa del backend para más detalles.

## Licencia

Sistema de gestión © 2026 — Acceso restringido
