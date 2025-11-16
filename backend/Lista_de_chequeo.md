Listas de chequeo


# ✔ 1. LISTAS DE CHEQUEO

## 1.1. Lista de Chequeo – Revisión de Artefactos
| Ítem | Cumple | Observaciones |
|------|--------|--------------|
| Revisión de rutas del backend (`routes/ventas.js`) | ☐ | |
| Identificación de campos del POST (cliente, id_producto, cantidad, canal) | ☐ | |
| Identificación de la ruta GET para listar ventas | ☐ | |
| Identificación de tablas relacionadas: ventas, detalle_venta, productos, clientes | ☐ | |
| Formatos de respuesta JSON verificados | ☐ | |

---

## 1.2. Lista de Chequeo – Código HTML
| Ítem | Cumple |
|------|--------|
| Incluye formulario de registro de ventas | ☐ |
| Campos completos: cliente, id_producto, cantidad, canal | ☐ |
| Tabla para listar ventas | ☐ |
| IDs correctos para conectar JS | ☐ |
| Comentarios explicativos claros | ☐ |

---

## 1.3. Lista de Chequeo – Código CSS
| Ítem | Cumple |
|------|--------|
| Formulario legible y ordenado | ☐ |
| Colores y espaciados correctos | ☐ |
| Tabla estilizada | ☐ |
| Comentarios incluidos | ☐ |

---

## 1.4. Lista de Chequeo – Código JavaScript
| Ítem | Cumple |
|------|--------|
| Fetch GET a `/productos` | ☐ |
| Fetch GET a `/ventas` | ☐ |
| Fetch POST a `/ventas` | ☐ |
| Validaciones básicas | ☐ |
| Actualización de tabla | ☐ |
| Comentarios explicativos | ☐ |

---

## 1.5. Lista de Chequeo – Validación funcional
| Funcionalidad | Cumple |
|---------------|---------|
| Registra una venta correctamente | ☐ |
| Descuenta stock del inventario | ☐ |
| Lista las ventas con detalles | ☐ |
| Muestra el total calculado | ☐ |
| Manejo correcto de errores | ☐ |

---

---

## 📝 Registrar Venta

**Cliente:**  
[_____________________________]

**Producto:**  
Converse blanca talla 36 ⬇️

**Cantidad:**  
1

**Canal:**  
WhatsApp ⬇️

[ **Registrar Venta** ]

## 📋 Lista de Ventas

| ID | Cliente | Fecha       | Total     | Productos                              |
|----|---------|-------------|-----------|-----------------------------------------|
| 12 | Ana     | 2025-11-14  | $120,000  | Converse blanca (36) x1                 |
| 11 | Pedro   | 2025-11-14  | $240,000  | Botas café (38) x2   



---

# 💻 3. CÓDIGO COMPLETO – ventas.html

```html
<!-- ventas.html – Frontend -->
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Ventas</title>
  <link rel="stylesheet" href="ventas.css">
</head>

<body>

  <h1>Registrar Venta</h1>

  <!-- Formulario de registro -->
  <form id="formVenta">

    <!-- Nombre del cliente -->
    <label>Cliente:</label>
    <input type="text" id="cliente" required>

    <!-- Productos cargados desde backend -->
    <label>Producto:</label>
    <select id="id_producto" required></select>

    <!-- Cantidad -->
    <label>Cantidad:</label>
    <input type="number" id="cantidad" min="1" required>

    <!-- Canal de venta -->
    <label>Canal:</label>
    <select id="canal">
      <option value="Tienda Física">Tienda Física</option>
      <option value="Instagram">Instagram</option>
      <option value="WhatsApp">WhatsApp</option>
      <option value="Facebook">Facebook</option>
      <option value="Página Web">Página Web</option>
    </select>

    <button type="submit">Registrar Venta</button>
  </form>

  <hr>

  <!-- Tabla de ventas -->
  <h2>Lista de Ventas</h2>
  <table id="tablaVentas">
    <thead>
      <tr>
        <th>ID</th>
        <th>Cliente</th>
        <th>Fecha</th>
        <th>Total</th>
        <th>Productos</th>
      </tr>
    </thead>
    <tbody></tbody>
  </table>

  <script src="ventas.js"></script>
</body>
</html>


/* ventas.css – Estilos básicos */

/* Estilo general del cuerpo */
body {
  font-family: Arial, sans-serif;
  margin: 30px;
}

/* Formulario */
form {
  display: grid;
  gap: 10px;
  width: 300px;
  margin-bottom: 25px;
}

/* Botón */
button {
  padding: 8px;
  background: #1e88e5;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

/* Tabla */
table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  border: 1px solid #ccc;
  padding: 8px;
}

th {
  background: #f0f0f0;
}

// ventas.js – Funciones para manejar ventas

// Cargar productos en el select
async function cargarProductos() {
  const res = await fetch("/productos");
  const productos = await res.json();

  const select = document.getElementById("id_producto");

  productos.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.id_producto;
    opt.textContent = `${p.nombre} - ${p.descripcion} (${p.talla}, ${p.color})`;
    select.appendChild(opt);
  });
}

// Cargar ventas en la tabla
async function cargarVentas() {
  const res = await fetch("/ventas");
  const ventas = await res.json();

  const tbody = document.querySelector("#tablaVentas tbody");
  tbody.innerHTML = "";

  ventas.forEach(v => {
    const fila = document.createElement("tr");

    fila.innerHTML = `
      <td>${v.id_venta}</td>
      <td>${v.nombre_cliente}</td>
      <td>${v.fecha_venta}</td>
      <td>$${v.total}</td>
      <td>${v.productos}</td>
    `;

    tbody.appendChild(fila);
  });
}

// Enviar la venta al backend
document.getElementById("formVenta").addEventListener("submit", async (e) => {
  e.preventDefault();

  const venta = {
    cliente: document.getElementById("cliente").value,
    id_producto: document.getElementById("id_producto").value,
    cantidad: document.getElementById("cantidad").value,
    canal: document.getElementById("canal").value
  };

  const res = await fetch("/ventas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(venta)
  });

  const data = await res.json();
  alert(data.mensaje || data.error);

  cargarVentas();
});

// Ejecución inicial
cargarProductos();
cargarVentas();
