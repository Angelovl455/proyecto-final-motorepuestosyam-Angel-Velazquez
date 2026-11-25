# Inventario Motorepuestos Yam

## Descripción General
**Inventario Motorepuestos Yam** es una aplicación web desarrollada como Proyecto Final de Trimestre para la Universidad Tecnológica del Centro (UNITEC) – Programa Code-Peques. El sistema resuelve la problemática del control manual y desorganizado de existencias en tiendas de repuestos de motocicletas, permitiendo registrar, editar, consultar y eliminar artículos, así como simular ventas con cálculo automático del IVA (16%) y mantener la integridad de los datos mediante validaciones preventivas y respaldo híbrido.

---

## Tecnologías y Librerías Utilizadas
* **HTML5:** Estructuración semántica del formulario de registro, controles de acción y tabla dinámica de inventario.
* **CSS3:** Diseño visual responsivo, paleta corporativa y estilos de alertas y tablas.
* **JavaScript (ES6+):** Lógica de negocio modularizada bajo el principio de responsabilidad única, validación de entradas, cálculos de impuestos y gestión de eventos.
* **JSON y LocalStorage:** Persistencia local de datos y carga inicial estructurada desde `data.json` con respaldo automático en memoria.
* **Vercel / GitHub:** Despliegue en la nube y control de versiones del repositorio.

---

## Estructura del Repositorio
```text
inventario-motorepuestosyam/
├── index.html          # Interfaz principal de usuario (formulario de repuestos y tabla de inventario)
├── style.css           # Hoja de estilos visuales y diseño responsivo de la aplicación
├── app.js              # Lógica modularizada: carga híbrida, validaciones, CRUD y simulación de ventas
├── data.json           # Base de datos inicial en formato JSON con el catálogo de repuestos
└── README.md           # Documentación técnica oficial del repositorio
```

---

## Instrucciones de Instalación y Configuración
1. **Ejecución en la Nube (Recomendada):**
   * Accede directamente al enlace público desplegado en Vercel (`https://inventario-motorepuestosyam.vercel.app` — *reemplaza con tu URL exacta de Vercel*). No requiere instalación adicional.
2. **Ejecución en Estación de Trabajo Local:**
   * Descarga y descomprime el archivo `.zip` del proyecto en una carpeta local.
   * Abre el archivo `index.html` directamente en cualquier navegador moderno (Google Chrome, Microsoft Edge o Firefox) o ejecútalo mediante la extensión **Live Server** en Visual Studio Code.

---

## Guía Rápida de Uso
1. **Visualización del Inventario Inicial:** Al iniciar la aplicación, se cargará automáticamente el catálogo base de repuestos (`data.json`). Si deseas volver al estado original en cualquier momento, haz clic en **Restaurar Base JSON**.
2. **Registro o Edición de Repuestos:** Ingresa el **Código** (ej. `MY-011`), **Descripción del Repuesto**, **Marca / Compatibilidad**, **Precio** y **Stock** en el formulario superior y presiona **Agregar Repuesto** (el sistema validará que no existan campos vacíos ni valores negativos o no numéricos).
3. **Simulación de Venta:** Selecciona un repuesto de la tabla y haz clic en **Simular Venta (Con IVA 16%)** para calcular automáticamente el subtotal, el impuesto correspondiente y actualizar las existencias disponibles.
4. **Eliminación de Registros:** Selecciona el artículo deseado en el listado y presiona **Eliminar Seleccionado** para retirarlo del inventario activo.