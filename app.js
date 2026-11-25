const TASA_IVA = 0.16;
const STORAGE_KEY = "inventario_motorepuestos_yam";
const CODIGO_VALIDO = /^[A-Z0-9][A-Z0-9-]*$/;

let listaRepuestos = [];
let codigoSeleccionado = null;

// Valida y normaliza los registros recibidos desde JSON o almacenamiento local.
function validarInventario(datos) {
  if (!Array.isArray(datos)) {
    throw new Error("El inventario debe ser una lista de repuestos.");
  }

  const codigos = new Set();
  return datos.map((repuesto, indice) => {
    if (!repuesto || typeof repuesto !== "object" || Array.isArray(repuesto)) {
      throw new Error(`El registro ${indice + 1} no es un objeto válido.`);
    }

    const codigo = typeof repuesto.codigo === "string" ? repuesto.codigo.trim().toUpperCase() : "";
    const nombre = typeof repuesto.nombre === "string" ? repuesto.nombre.trim() : "";
    const marca = typeof repuesto.marca === "string" ? repuesto.marca.trim() : "";
    const precioUsd = repuesto.precio_usd;
    const stockUnidades = repuesto.stock;

    if (!CODIGO_VALIDO.test(codigo) || !nombre || !marca) {
      throw new Error(`El registro ${indice + 1} tiene código, nombre o marca inválidos.`);
    }
    if (codigos.has(codigo)) {
      throw new Error(`El código ${codigo} está duplicado en el inventario.`);
    }
    if (typeof precioUsd !== "number" || !Number.isFinite(precioUsd) || precioUsd <= 0) {
      throw new Error(`El precio del repuesto ${codigo} debe ser un número mayor a cero.`);
    }
    if (!Number.isSafeInteger(stockUnidades) || stockUnidades < 0) {
      throw new Error(`El stock del repuesto ${codigo} debe ser un entero no negativo.`);
    }

    codigos.add(codigo);
    return {
      codigo,
      nombre,
      marca,
      precio_usd: Number(precioUsd.toFixed(2)),
      stock: stockUnidades
    };
  });
}

function guardarInventario(repuestos) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(repuestos));
}

async function cargarDatosBase() {
  const respuesta = await fetch("data.json");
  if (!respuesta.ok) {
    throw new Error(`No se pudo leer data.json (HTTP ${respuesta.status}).`);
  }
  return validarInventario(await respuesta.json());
}

// Prioriza los cambios guardados; si están dañados, recupera los datos base.
async function cargarInventario() {
  try {
    const guardadoLocal = localStorage.getItem(STORAGE_KEY);
    if (guardadoLocal !== null) {
      try {
        return validarInventario(JSON.parse(guardadoLocal));
      } catch (error) {
        console.warn("Datos locales inválidos; se intentará cargar data.json.", error);
      }
    }
  } catch (error) {
    console.warn("No se pudo leer el almacenamiento local; se intentará cargar data.json.", error);
  }

  let inventarioBase;
  try {
    inventarioBase = await cargarDatosBase();
  } catch (error) {
    mostrarAlerta(`No se pudo cargar el inventario: ${error.message}`, "error");
    return [];
  }

  try {
    guardarInventario(inventarioBase);
  } catch (error) {
    mostrarAlerta(
      `Inventario cargado, pero no se pudo guardar localmente: ${error.message}`,
      "error"
    );
  }
  return inventarioBase;
}

// Valida los campos del formulario antes de crear un repuesto.
function validarDatosRepuesto(codigo, nombre, marca, precioTexto, stockTexto) {
  const codigoLimpio = codigo.trim().toUpperCase();
  const nombreLimpio = nombre.trim();
  const marcaLimpia = marca.trim();

  if (!codigoLimpio || !nombreLimpio || !marcaLimpia) {
    throw new Error("Todos los campos de texto (Código, Nombre, Marca) son obligatorios.");
  }
  if (!CODIGO_VALIDO.test(codigoLimpio)) {
    throw new Error("El código solo puede contener letras, números y guiones.");
  }

  const precioLimpio = precioTexto.trim().replace(",", ".");
  if (!/^\d+(?:\.\d{1,2})?$/.test(precioLimpio)) {
    throw new Error("El precio debe ser numérico y tener como máximo dos decimales (ej. 15.50).");
  }
  const precioUsd = Number(precioLimpio);
  if (!Number.isFinite(precioUsd) || precioUsd <= 0) {
    throw new Error("El precio en USD debe ser mayor a cero.");
  }

  const stockLimpio = stockTexto.trim();
  if (!/^\d+$/.test(stockLimpio)) {
    throw new Error("El stock debe ser un número entero no negativo.");
  }
  const stockUnidades = Number(stockLimpio);
  if (!Number.isSafeInteger(stockUnidades)) {
    throw new Error("El stock ingresado está fuera del rango permitido.");
  }

  return {
    codigo: codigoLimpio,
    nombre: nombreLimpio,
    marca: marcaLimpia,
    precio_usd: Number(precioUsd.toFixed(2)),
    stock: stockUnidades
  };
}

function calcularTotalesVenta(precioUnitarioUsd, cantidad = 1, incluirIva = true) {
  if (!Number.isFinite(precioUnitarioUsd) || precioUnitarioUsd <= 0 ||
      !Number.isInteger(cantidad) || cantidad <= 0) {
    throw new Error("El precio y la cantidad deben ser valores válidos mayores a cero.");
  }

  const subtotal = Number((precioUnitarioUsd * cantidad).toFixed(2));
  const montoIva = incluirIva ? Number((subtotal * TASA_IVA).toFixed(2)) : 0;
  return {
    subtotal,
    iva: montoIva,
    total: Number((subtotal + montoIva).toFixed(2))
  };
}

function filtrarRepuestos(repuestos, terminoBusqueda) {
  const consulta = terminoBusqueda.trim().toLowerCase();
  if (!consulta) return repuestos;

  return repuestos.filter((repuesto) =>
    [repuesto.codigo, repuesto.nombre, repuesto.marca]
      .some((dato) => dato.toLowerCase().includes(consulta))
  );
}

function calcularValorTotalInventario(repuestos) {
  const valorCentimos = repuestos.reduce(
    (acumulado, repuesto) =>
      acumulado + Math.round(repuesto.precio_usd * 100) * repuesto.stock,
    0
  );
  const unidadesTotales = repuestos.reduce(
    (acumulado, repuesto) => acumulado + repuesto.stock,
    0
  );

  return {
    valorTotal: valorCentimos / 100,
    unidadesTotales
  };
}

function mostrarAlerta(mensaje, tipo = "info") {
  const cajaAlerta = document.getElementById("alerta-sistema");
  cajaAlerta.textContent = mensaje;
  cajaAlerta.className = `alerta ${tipo}`;
}

// Construye filas como nodos de texto para no interpretar datos como HTML.
function actualizarTabla(registros) {
  const cuerpoTabla = document.getElementById("cuerpo-tabla");
  cuerpoTabla.replaceChildren();

  registros.forEach((repuesto) => {
    const fila = document.createElement("tr");
    if (repuesto.codigo === codigoSeleccionado) {
      fila.classList.add("seleccionada");
    }

    [
      repuesto.codigo,
      repuesto.nombre,
      repuesto.marca,
      `$${repuesto.precio_usd.toFixed(2)}`,
      String(repuesto.stock)
    ].forEach((valor) => {
      const celda = document.createElement("td");
      celda.textContent = valor;
      fila.appendChild(celda);
    });

    fila.addEventListener("click", () => {
      codigoSeleccionado = repuesto.codigo;
      actualizarTabla(filtrarRepuestos(
        listaRepuestos,
        document.getElementById("busqueda").value
      ));
    });
    cuerpoTabla.appendChild(fila);
  });

  const { valorTotal, unidadesTotales } = calcularValorTotalInventario(listaRepuestos);
  const formatoMoneda = valorTotal.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  document.getElementById("resumen-global").textContent =
    `Total Items: ${listaRepuestos.length} | Unidades en Stock: ${unidadesTotales} | Valorización Total: $${formatoMoneda} USD`;
}

document.getElementById("form-repuesto").addEventListener("submit", (evento) => {
  evento.preventDefault();

  try {
    const nuevoRepuesto = validarDatosRepuesto(
      document.getElementById("codigo").value,
      document.getElementById("nombre").value,
      document.getElementById("marca").value,
      document.getElementById("precio").value,
      document.getElementById("stock").value
    );

    if (listaRepuestos.some((repuesto) => repuesto.codigo === nuevoRepuesto.codigo)) {
      throw new Error(`Ya existe un repuesto con el código ${nuevoRepuesto.codigo}.`);
    }

    const inventarioActualizado = [...listaRepuestos, nuevoRepuesto];
    guardarInventario(inventarioActualizado);
    listaRepuestos = inventarioActualizado;
    evento.target.reset();
    document.getElementById("busqueda").value = "";
    actualizarTabla(listaRepuestos);
    mostrarAlerta("Repuesto registrado correctamente en el inventario.", "exito");
  } catch (error) {
    mostrarAlerta(`No se pudo registrar el repuesto: ${error.message}`, "error");
  }
});

document.getElementById("btn-simular-venta").addEventListener("click", () => {
  const repuesto = listaRepuestos.find((item) => item.codigo === codigoSeleccionado);
  if (!repuesto) {
    mostrarAlerta("Haz clic sobre un repuesto de la tabla para cotizar.", "info");
    return;
  }

  try {
    const totales = calcularTotalesVenta(repuesto.precio_usd, 1, true);
    mostrarAlerta(
      `Cotización Rápida (1 Unidad)\n` +
        `Repuesto: ${repuesto.nombre} (${repuesto.codigo})\n` +
        `Subtotal: $${totales.subtotal.toFixed(2)} USD | IVA (16%): $${totales.iva.toFixed(2)} USD | Total a Pagar: $${totales.total.toFixed(2)} USD`,
      "info"
    );
  } catch (error) {
    mostrarAlerta(`No se pudo calcular la cotización: ${error.message}`, "error");
  }
});

document.getElementById("btn-eliminar").addEventListener("click", () => {
  if (!codigoSeleccionado) {
    mostrarAlerta("Haz clic sobre un repuesto de la tabla para eliminarlo.", "info");
    return;
  }
  if (!confirm(`¿Desea eliminar el repuesto ${codigoSeleccionado}?`)) return;

  try {
    const inventarioActualizado = listaRepuestos.filter(
      (repuesto) => repuesto.codigo !== codigoSeleccionado
    );
    guardarInventario(inventarioActualizado);
    listaRepuestos = inventarioActualizado;
    codigoSeleccionado = null;
    actualizarTabla(filtrarRepuestos(
      listaRepuestos,
      document.getElementById("busqueda").value
    ));
    mostrarAlerta("Repuesto eliminado del inventario.", "exito");
  } catch (error) {
    mostrarAlerta(`No se pudo eliminar el repuesto: ${error.message}`, "error");
  }
});

document.getElementById("btn-restaurar").addEventListener("click", async () => {
  try {
    const inventarioBase = await cargarDatosBase();
    guardarInventario(inventarioBase);
    listaRepuestos = inventarioBase;
    codigoSeleccionado = null;
    document.getElementById("busqueda").value = "";
    actualizarTabla(listaRepuestos);
    mostrarAlerta("Inventario restaurado con los datos iniciales de data.json.", "info");
  } catch (error) {
    mostrarAlerta(`No se pudo restaurar el inventario: ${error.message}`, "error");
  }
});

document.getElementById("busqueda").addEventListener("input", (evento) => {
  actualizarTabla(filtrarRepuestos(listaRepuestos, evento.target.value));
});

window.addEventListener("DOMContentLoaded", async () => {
  listaRepuestos = await cargarInventario();
  actualizarTabla(listaRepuestos);
});
