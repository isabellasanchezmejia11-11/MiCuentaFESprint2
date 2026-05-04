# MiCuenta - Gestión Financiera Personal

Aplicación web de gestión financiera personal desarrollada como propuesta para el programa **CodeF@ctory** de la Universidad de Antioquia.

## 🚀 Cómo correr el proyecto

```bash
# Instalar dependencias 
npm install

# Ejecutar en desarrollo
npm run dev

# Abrir en navegador
# http://localhost:5173
```

## 📋 Historias de Usuario Implementadas (Hito 1)

| HU | Nombre | SP | Descripción |
|----|--------|-----|-------------|
| HU-01 | Registro de usuario | 3 | Crear cuenta con nombre, correo y contraseña |
| HU-03 | Inicio de sesión | 3 | Login con correo y contraseña |
| HU-08 | Registrar ingreso | 3 | Registrar ingresos con monto, fecha, categoría |
| HU-09 | Registrar gasto | 5 | Registrar gastos con alertas de presupuesto |
| HU-10 | Listar movimientos | 3 | Ver historial de movimientos con filtros |
| HU-18 | Dashboard financiero | 3 | Resumen con stats y gráfica de evolución |

**Total: 20 Story Points**

## 🎨 Diseño

### Paleta de Colores

| Elemento | Color |
|----------|-------|
| Sidebar | `#0d2260` (navy) |
| Acento principal | `#2952cc` (azul) |
| Ingresos | `#1a8a4a` (verde) |
| Gastos | `#d93025` (rojo) |
| Balance positivo | `#2952cc` (azul) |
| Balance negativo | `#d93025` (rojo) |

### Tipografía

- **Font principal**: Inter (Google Fonts)
- **Tamaños**: 10px-28px según componente

## 📁 Estructura del Proyecto

```
frontend/
├── src/
│   ├── components/
│   │   ├── Layout.jsx        # Layout principal (Sidebar + contenido)
│   │   ├── Layout.css
│   │   ├── Sidebar.jsx       # Navegación lateral
│   │   ├── Sidebar.css
│   │   └── PrivateRoute.jsx   # Protección de rutas
│   │
│   ├── pages/
│   │   ├── Login.jsx         # HU-03: Inicio de sesión
│   │   ├── Auth.css
│   │   ├── Registro.jsx       # HU-01: Registro de usuario
│   │   ├── Dashboard.jsx     # HU-18: Dashboard financiero
│   │   ├── Dashboard.css
│   │   ├── Movimientos.jsx   # HU-10: Listar movimientos
│   │   ├── Movimientos.css
│   │   ├── RegistrarMovimiento.jsx  # HU-08 + HU-09
│   │   └── RegistrarMovimiento.css
│   │
│   ├── services/
│   │   ├── authService.js    # Autenticación (localStorage)
│   │   └── movimientosService.js  # CRUD movimientos
│   │
│   ├── context/
│   │   └── AuthContext.jsx   # Context API para auth
│   │
│   ├── App.jsx               # Router principal
│   ├── App.css
│   ├── main.jsx              # Entry point
│   └── index.css             # Estilos globales
│
├── index.html
├── package.json
├── vite.config.js
└── README.md
```


### Categorías por Defecto

**Ingresos**: Salario, Freelance, Inversiones, Otros  
**Gastos**: Alimentación, Transporte, Servicios, Salud



## 🔧 Tecnologías

- **Framework**: React 19 (Vite)
- **Router**: React Router DOM v7
- **Estilos**: CSS puro (sin frameworks)
- **Estado**: React Context + useState
- **Datos**: localStorage



**Universidad de Antioquia** · CodeF@ctory 2026-1
