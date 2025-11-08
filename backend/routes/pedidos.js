// ✅ routes/pedidos.js
import express from "express";
import { db } from "../db.js";

const router = express.Router();

// =====================================
// 🔹 Obtener todos los pedidos con detalles
// =====================================
router.get("/", async (req, res) => {
  try {
    const [pedidos] = await db.query(`
      SELECT 
        p.id_pedido,
        p.id_cliente,
        c.nombre as nombre_cliente,
        p.fecha_pedido,
        p.fecha_entrega,
        p.estado,
        p.total,
        p.observaciones,
        GROUP_CONCAT(
          CONCAT(pr.nombre, ' - ', pr.descripcion, ' (', pr.talla, ', ', pr.color, ') x', dp.cantidad)
          SEPARATOR ', '
        ) as productos
      FROM pedidos p
      LEFT JOIN clientes c ON p.id_cliente = c.id_cliente
      LEFT JOIN detalle_pedido dp ON p.id_pedido = dp.id_pedido
      LEFT JOIN productos pr ON dp.id_producto = pr.id_producto
      GROUP BY p.id_pedido
      ORDER BY p.fecha_pedido DESC
    `);
    res.json(pedidos);
  } catch (error) {
    console.error("❌ Error al obtener pedidos:", error);
    res.status(500).json({ error: "Error al obtener pedidos" });
  }
});

// =====================================
// 🔹 Crear un nuevo pedido
// =====================================
router.post("/", async (req, res) => {
  try {
    const { cliente, productos, fecha_entrega, observaciones, canal } = req.body;

    // Validación
    if (!cliente || !productos || productos.length === 0) {
      return res.status(400).json({ error: "Cliente y productos son obligatorios." });
    }

    // Validar canal
    const canalPedido = canal || 'Instagram';
    const canalesValidos = ['Tienda Física', 'Instagram', 'WhatsApp', 'Facebook', 'Página Web'];
    if (!canalesValidos.includes(canalPedido)) {
      return res.status(400).json({ error: "Canal no válido." });
    }

    // 🔹 Buscar o crear el cliente
    let [clienteInfo] = await db.query(
      "SELECT id_cliente FROM clientes WHERE nombre = ?",
      [cliente]
    );

    let idCliente;
    if (clienteInfo.length === 0) {
      const [nuevoCliente] = await db.query(
        "INSERT INTO clientes (nombre) VALUES (?)",
        [cliente]
      );
      idCliente = nuevoCliente.insertId;
    } else {
      idCliente = clienteInfo[0].id_cliente;
    }

    // 🔹 Calcular el total del pedido
    let totalPedido = 0;
    const productosValidados = [];

    for (const item of productos) {
      const [productoInfo] = await db.query(
        "SELECT id_producto, precio, cantidad FROM productos WHERE id_producto = ?",
        [item.id_producto]
      );

      if (productoInfo.length === 0) {
        return res.status(404).json({ 
          error: `Producto con ID ${item.id_producto} no existe.` 
        });
      }

      const producto = productoInfo[0];
      const precioUnitario = producto.precio || 0;
      const subtotal = precioUnitario * item.cantidad;
      totalPedido += subtotal;

      productosValidados.push({
        id_producto: item.id_producto,
        cantidad: item.cantidad,
        precio_unitario: precioUnitario
      });
    }

    // 🔹 Crear el pedido
    const sqlPedido = `
      INSERT INTO pedidos (id_cliente, id_usuario, fecha_entrega, estado, total, observaciones)
      VALUES (?, ?, ?, 'Pendiente', ?, ?)
    `;
    const [resultPedido] = await db.query(sqlPedido, [
      idCliente, 
      1, 
      fecha_entrega || null, 
      totalPedido,
      observaciones || null
    ]);

    // 🔹 Insertar detalles del pedido
    for (const prod of productosValidados) {
      await db.query(
        "INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio_unitario) VALUES (?, ?, ?, ?)",
        [resultPedido.insertId, prod.id_producto, prod.cantidad, prod.precio_unitario]
      );
    }

    res.json({ 
      mensaje: "✅ Pedido creado correctamente", 
      id_pedido: resultPedido.insertId,
      total: totalPedido
    });

  } catch (error) {
    console.error("❌ Error al crear pedido:", error);
    res.status(500).json({ error: "Error al crear pedido: " + error.message });
  }
});

// =====================================
// 🔹 Cambiar estado de un pedido
// =====================================
router.patch("/:id/estado", async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const estadosValidos = ['Pendiente', 'En Proceso', 'Listo', 'Entregado', 'Cancelado'];
    
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ error: "Estado no válido" });
    }

    // Si el estado es "Entregado", crear la venta automáticamente
    if (estado === 'Entregado') {
      // Obtener información del pedido
      const [pedidoInfo] = await db.query(
        "SELECT id_cliente, total FROM pedidos WHERE id_pedido = ?",
        [id]
      );

      if (pedidoInfo.length === 0) {
        return res.status(404).json({ error: "Pedido no encontrado" });
      }

      const pedido = pedidoInfo[0];

      // Crear la venta
      const [resultVenta] = await db.query(
        "INSERT INTO ventas (id_cliente, id_usuario, fecha_venta, total) VALUES (?, ?, NOW(), ?)",
        [pedido.id_cliente, 1, pedido.total]
      );

      // Copiar detalles del pedido a detalle_venta
      const [detallesPedido] = await db.query(
        "SELECT id_producto, cantidad, precio_unitario FROM detalle_pedido WHERE id_pedido = ?",
        [id]
      );

      for (const detalle of detallesPedido) {
        // Insertar en detalle_venta
        await db.query(
          "INSERT INTO detalle_venta (id_venta, id_producto, cantidad, precio_unitario) VALUES (?, ?, ?, ?)",
          [resultVenta.insertId, detalle.id_producto, detalle.cantidad, detalle.precio_unitario]
        );

        // Descontar del inventario
        await db.query(
          "UPDATE productos SET cantidad = cantidad - ? WHERE id_producto = ?",
          [detalle.cantidad, detalle.id_producto]
        );
      }
    }

    // Actualizar estado del pedido
    await db.query(
      "UPDATE pedidos SET estado = ? WHERE id_pedido = ?",
      [estado, id]
    );

    res.json({ mensaje: `✅ Pedido marcado como ${estado}` });

  } catch (error) {
    console.error("❌ Error al cambiar estado:", error);
    res.status(500).json({ error: "Error al cambiar estado del pedido" });
  }
});

// =====================================
// 🔹 Eliminar/Cancelar pedido
// =====================================
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el pedido no esté entregado
    const [pedido] = await db.query(
      "SELECT estado FROM pedidos WHERE id_pedido = ?",
      [id]
    );

    if (pedido.length === 0) {
      return res.status(404).json({ error: "Pedido no encontrado" });
    }

    if (pedido[0].estado === 'Entregado') {
      return res.status(400).json({ 
        error: "No se puede eliminar un pedido ya entregado" 
      });
    }

    // Eliminar el pedido (el detalle se elimina automáticamente por CASCADE)
    await db.query("DELETE FROM pedidos WHERE id_pedido = ?", [id]);

    res.json({ mensaje: "✅ Pedido eliminado correctamente" });

  } catch (error) {
    console.error("❌ Error al eliminar pedido:", error);
    res.status(500).json({ error: "Error al eliminar pedido" });
  }
});

export default router;