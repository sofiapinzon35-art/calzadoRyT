// ✅ routes/ventas.js
import express from "express";
import { db } from "../db.js";

const router = express.Router();

// =====================================
// 🔹 Obtener todas las ventas con detalles
// =====================================
router.get("/", async (req, res) => {
  try {
    const [ventas] = await db.query(`
      SELECT 
        v.id_venta,
        v.id_cliente,
        c.nombre as nombre_cliente,
        v.fecha_venta,
        v.total,
        GROUP_CONCAT(
          CONCAT(p.nombre, ' - ', p.descripcion, ' (', p.talla, ', ', p.color, ') x', dv.cantidad)
          SEPARATOR ', '
        ) as productos
      FROM ventas v
      LEFT JOIN clientes c ON v.id_cliente = c.id_cliente
      LEFT JOIN detalle_venta dv ON v.id_venta = dv.id_venta
      LEFT JOIN productos p ON dv.id_producto = p.id_producto
      GROUP BY v.id_venta
      ORDER BY v.fecha_venta DESC
    `);
    res.json(ventas);
  } catch (error) {
    console.error("❌ Error al obtener ventas:", error);
    res.status(500).json({ error: "Error al obtener ventas" });
  }
});

// =====================================
// 🔹 Registrar una nueva venta + actualizar inventario
// =====================================
router.post("/", async (req, res) => {
  try {
    const { cliente, id_producto, cantidad, canal } = req.body;

    // Validación de campos
    if (!cliente || !id_producto || !cantidad) {
      return res.status(400).json({ error: "Todos los campos son obligatorios." });
    }

    // Validar canal
    const canalVenta = canal || 'Tienda Física';
    const canalesValidos = ['Tienda Física', 'Instagram', 'WhatsApp', 'Facebook', 'Página Web'];
    if (!canalesValidos.includes(canalVenta)) {
      return res.status(400).json({ error: "Canal no válido." });
    }

    if (cantidad <= 0) {
      return res.status(400).json({ error: "La cantidad debe ser mayor a 0." });
    }

    // 🔹 Verificar si el producto existe en el inventario
    const [productoInfo] = await db.query(
      "SELECT id_producto, nombre, descripcion, talla, color, cantidad, precio FROM productos WHERE id_producto = ?",
      [id_producto]
    );

    if (productoInfo.length === 0) {
      return res.status(404).json({ 
        error: `El producto no existe en el inventario.` 
      });
    }

    const producto = productoInfo[0];
    const idProducto = producto.id_producto;
    const stockActual = producto.cantidad;
    const precioUnitario = producto.precio || 0;

    // 🔹 Verificar si hay suficiente stock
    if (stockActual < cantidad) {
      return res.status(400).json({ 
        error: `Stock insuficiente. Disponible: ${stockActual}, Solicitado: ${cantidad}` 
      });
    }

    // 🔹 Buscar o crear el cliente
    let [clienteInfo] = await db.query(
      "SELECT id_cliente FROM clientes WHERE nombre = ?",
      [cliente]
    );

    let idCliente;
    if (clienteInfo.length === 0) {
      // Si el cliente no existe, crearlo con solo el nombre
      const [nuevoCliente] = await db.query(
        "INSERT INTO clientes (nombre) VALUES (?)",
        [cliente]
      );
      idCliente = nuevoCliente.insertId;
    } else {
      idCliente = clienteInfo[0].id_cliente;
    }

    // 🔹 Calcular el total de la venta
    const totalVenta = precioUnitario * cantidad;

    // 🔹 Registrar la venta en la tabla 'ventas'
    const sqlVenta = `
      INSERT INTO ventas (id_cliente, id_usuario, fecha_venta, total)
      VALUES (?, ?, NOW(), ?)
    `;
    const [resultVenta] = await db.query(sqlVenta, [idCliente, 1, totalVenta]);

    // 🔹 Registrar el detalle de la venta
    // Nota: 'subtotal' es una columna generada, no se inserta manualmente
    const sqlDetalle = `
      INSERT INTO detalle_venta (id_venta, id_producto, cantidad, precio_unitario)
      VALUES (?, ?, ?, ?)
    `;
    await db.query(sqlDetalle, [resultVenta.insertId, idProducto, cantidad, precioUnitario]);

    // 🔹 Actualizar el inventario (restar cantidad)
    const sqlUpdate = `
      UPDATE productos
      SET cantidad = cantidad - ?
      WHERE id_producto = ? AND cantidad >= ?
    `;
    const [updateResult] = await db.query(sqlUpdate, [cantidad, idProducto, cantidad]);

    // Verificar que la actualización fue exitosa
    if (updateResult.affectedRows === 0) {
      return res.status(500).json({ 
        error: "Error al actualizar el inventario. Intenta nuevamente." 
      });
    }

    res.json({ 
      mensaje: "✅ Venta registrada y stock actualizado correctamente", 
      id: resultVenta.insertId,
      stockRestante: stockActual - cantidad,
      total: totalVenta,
      productoVendido: `${producto.nombre} - ${producto.descripcion} (${producto.talla}, ${producto.color})`
    });

  } catch (error) {
    console.error("❌ Error al registrar venta:", error);
    res.status(500).json({ error: "Error al registrar venta: " + error.message });
  }
});

export default router;





