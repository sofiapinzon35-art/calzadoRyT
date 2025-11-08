// ✅ routes/reabastecimiento.js
import express from "express";
import { db } from "../db.js";

const router = express.Router();

// ========================================
// 🔹 PROVEEDORES
// ========================================

// Obtener todos los proveedores
router.get("/proveedores", async (req, res) => {
  try {
    const [proveedores] = await db.query("SELECT * FROM proveedores ORDER BY nombre");
    res.json(proveedores);
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: "Error al obtener proveedores" });
  }
});

// Crear proveedor
router.post("/proveedores", async (req, res) => {
  try {
    const { nombre, telefono, correo, direccion } = req.body;
    if (!nombre) return res.status(400).json({ error: "El nombre es obligatorio" });

    const [result] = await db.query(
      "INSERT INTO proveedores (nombre, telefono, correo, direccion) VALUES (?, ?, ?, ?)",
      [nombre, telefono, correo, direccion]
    );

    res.json({ mensaje: "✅ Proveedor creado", id: result.insertId });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: "Error al crear proveedor" });
  }
});

// ========================================
// 🔹 PRODUCTOS CON STOCK BAJO
// ========================================

router.get("/stock-bajo", async (req, res) => {
  try {
    const limite = req.query.limite || 10; // Stock menor a 10 por defecto

    const [productos] = await db.query(`
      SELECT 
        id_producto,
        CONCAT(nombre, ' - ', descripcion, ' (', talla, ', ', color, ')') AS producto_completo,
        nombre,
        descripcion,
        talla,
        color,
        categoria,
        cantidad,
        precio
      FROM productos
      WHERE cantidad < ?
      ORDER BY cantidad ASC
    `, [limite]);

    res.json(productos);
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: "Error al obtener productos con stock bajo" });
  }
});

// ========================================
// 🔹 ÓRDENES DE REABASTECIMIENTO
// ========================================

// Obtener todas las órdenes
router.get("/ordenes", async (req, res) => {
  try {
    const [ordenes] = await db.query(`
      SELECT 
        r.id_reabastecimiento,
        r.id_proveedor,
        p.nombre AS proveedor,
        r.fecha_orden,
        r.fecha_recepcion,
        r.estado,
        r.total,
        r.observaciones,
        GROUP_CONCAT(
          CONCAT(pr.nombre, ' - ', pr.descripcion, ' (', pr.talla, ', ', pr.color, ') x', dr.cantidad)
          SEPARATOR ', '
        ) AS productos
      FROM reabastecimientos r
      LEFT JOIN proveedores p ON r.id_proveedor = p.id_proveedor
      LEFT JOIN detalle_reabastecimiento dr ON r.id_reabastecimiento = dr.id_reabastecimiento
      LEFT JOIN productos pr ON dr.id_producto = pr.id_producto
      GROUP BY r.id_reabastecimiento
      ORDER BY r.fecha_orden DESC
    `);

    res.json(ordenes);
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: "Error al obtener órdenes" });
  }
});

// Crear orden de reabastecimiento
router.post("/ordenes", async (req, res) => {
  try {
    const { id_proveedor, productos, observaciones } = req.body;

    if (!id_proveedor || !productos || productos.length === 0) {
      return res.status(400).json({ error: "Proveedor y productos son obligatorios" });
    }

    // Calcular total
    let totalOrden = 0;
    const productosValidados = [];

    for (const item of productos) {
      const [productoInfo] = await db.query(
        "SELECT id_producto FROM productos WHERE id_producto = ?",
        [item.id_producto]
      );

      if (productoInfo.length === 0) {
        return res.status(404).json({ error: `Producto con ID ${item.id_producto} no existe` });
      }

      const precioCompra = parseFloat(item.precio_compra) || 0;
      const subtotal = precioCompra * item.cantidad;
      totalOrden += subtotal;

      productosValidados.push({
        id_producto: item.id_producto,
        cantidad: item.cantidad,
        precio_compra: precioCompra
      });
    }

    // Crear orden
    const [resultOrden] = await db.query(
      "INSERT INTO reabastecimientos (id_proveedor, id_usuario, estado, total, observaciones) VALUES (?, ?, 'Pendiente', ?, ?)",
      [id_proveedor, 1, totalOrden, observaciones || null]
    );

    // Insertar detalles
    for (const prod of productosValidados) {
      await db.query(
        "INSERT INTO detalle_reabastecimiento (id_reabastecimiento, id_producto, cantidad, precio_compra) VALUES (?, ?, ?, ?)",
        [resultOrden.insertId, prod.id_producto, prod.cantidad, prod.precio_compra]
      );
    }

    res.json({
      mensaje: "✅ Orden de reabastecimiento creada",
      id: resultOrden.insertId,
      total: totalOrden
    });

  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: "Error al crear orden: " + error.message });
  }
});

// Cambiar estado de orden
router.patch("/ordenes/:id/estado", async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const estadosValidos = ['Pendiente', 'Recibido', 'Cancelado'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ error: "Estado no válido" });
    }

    // Si se marca como "Recibido", aumentar inventario
    if (estado === 'Recibido') {
      const [detalles] = await db.query(
        "SELECT id_producto, cantidad FROM detalle_reabastecimiento WHERE id_reabastecimiento = ?",
        [id]
      );

      for (const detalle of detalles) {
        await db.query(
          "UPDATE productos SET cantidad = cantidad + ? WHERE id_producto = ?",
          [detalle.cantidad, detalle.id_producto]
        );
      }

      // Actualizar fecha de recepción
      await db.query(
        "UPDATE reabastecimientos SET estado = ?, fecha_recepcion = NOW() WHERE id_reabastecimiento = ?",
        [estado, id]
      );
    } else {
      // Solo actualizar estado
      await db.query(
        "UPDATE reabastecimientos SET estado = ? WHERE id_reabastecimiento = ?",
        [estado, id]
      );
    }

    res.json({ mensaje: `✅ Orden marcada como ${estado}` });

  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: "Error al cambiar estado" });
  }
});

// Eliminar orden
router.delete("/ordenes/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar estado
    const [orden] = await db.query(
      "SELECT estado FROM reabastecimientos WHERE id_reabastecimiento = ?",
      [id]
    );

    if (orden.length === 0) {
      return res.status(404).json({ error: "Orden no encontrada" });
    }

    if (orden[0].estado === 'Recibido') {
      return res.status(400).json({ error: "No se puede eliminar una orden recibida" });
    }

    await db.query("DELETE FROM reabastecimientos WHERE id_reabastecimiento = ?", [id]);

    res.json({ mensaje: "✅ Orden eliminada correctamente" });

  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: "Error al eliminar orden" });
  }
});

// ========================================
// 🔹 ESTADÍSTICAS
// ========================================

router.get("/stats", async (req, res) => {
  try {
    const [[totalOrdenes]] = await db.query(
      "SELECT COUNT(*) as total FROM reabastecimientos"
    );

    const [[totalGastado]] = await db.query(
      "SELECT SUM(total) as total FROM reabastecimientos WHERE estado = 'Recibido'"
    );

    const [[productosStockBajo]] = await db.query(
      "SELECT COUNT(*) as total FROM productos WHERE cantidad < 10"
    );

    const [[ordenesPendientes]] = await db.query(
      "SELECT COUNT(*) as total FROM reabastecimientos WHERE estado = 'Pendiente'"
    );

    res.json({
      totalOrdenes: totalOrdenes.total || 0,
      totalGastado: totalGastado.total || 0,
      productosStockBajo: productosStockBajo.total || 0,
      ordenesPendientes: ordenesPendientes.total || 0
    });

  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: "Error al obtener estadísticas" });
  }
});

export default router;