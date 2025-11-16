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


```html
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Registro de Ventas</title>

<style>
    body { font-family: Arial; padding: 20px; }
    input, select { padding: 6px; margin: 5px 0; width: 250px; }
    button { padding: 8px 15px; margin-top: 10px; cursor: pointer; }
    table { margin-top:20px; width: 100%; border-collapse: collapse; }
    table, th, td { border: 1px solid #444; }
    th, td { padding: 8px; text-align: left; }
    h2 { margin-top: 30px; }
</style>

</head>
<body>

<h2>Registrar Venta</h2>

<label>Cliente:</label><br>
<input id="cliente" type="text"><br>

<label>Producto:</label><br>
<select id="producto">
    <option value="Converse blanca (36)">Converse blanca talla 36</option>
    <option value="Botas café (38)">Botas café talla 38</option>
</select><br>

<label>Cantidad:</label><br>
<input id="cantidad" type="number" min="1" value="1"><br>

<label>Canal:</label><br>
<select id="canal">
    <option>WhatsApp</option>
    <option>Instagram</option>
    <option>Tienda física</option>
</select><br>

<button onclick="registrarVenta()">Registrar Venta</button>

<h2>Lista de Ventas</h2>

<table id="tablaVentas">
    <tr>
        <th>ID</th>
        <th>Cliente</th>
        <th>Fecha</th>
        <th>Total</th>
        <th>Productos</th>
    </tr>
    <tr>
        <td>12</td>
        <td>Ana</td>
        <td>2025-11-14</td>
        <td>$120000</td>
        <td>Converse blanca (36) x1</td>
    </tr>
    <tr>
        <td>11</td>
        <td>Pedro</td>
        <td>2025-11-14</td>
        <td>$240000</td>
        <td>Botas café (38) x2</td>
    </tr>
</table>

<script>
let idActual = 13;

function registrarVenta() {
    let cliente = document.getElementById("cliente").value;
    let producto = document.getElementById("producto").value;
    let cantidad = parseInt(document.getElementById("cantidad").value);
    let canal = document.getElementById("canal").value;

    if (cliente === "" || cantidad < 1) {
        alert("Por favor llene todos los campos.");
        return;
    }

    let precio = (producto.includes("Converse")) ? 120000 : 120000; // puedes cambiar precios aquí
    let total = precio * cantidad;
    let fecha = new Date().toISOString().split("T")[0];

    let tabla = document.getElementById("tablaVentas");

    let fila = `
        <tr>
            <td>${idActual}</td>
            <td>${cliente}</td>
            <td>${fecha}</td>
            <td>$${total}</td>
            <td>${producto} x${cantidad}</td>
        </tr>
    `;

    tabla.insertAdjacentHTML("beforeend", fila);

    idActual++;

    document.getElementById("cliente").value = "";
    document.getElementById("cantidad").value = 1;
}
</script>

</body>
</html>
