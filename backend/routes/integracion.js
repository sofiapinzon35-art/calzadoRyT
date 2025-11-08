// ✅ routes/integracion.js
import express from "express";
import { db } from "../db.js";

const router = express.Router();

// ========================================
// 🔹 DASHBOARD - Estadísticas generales
// ========================================
router.get("/dashboard", async (req, res) => {
  try {
    // Total de ventas por canal
    const [ventasPorCanal] = await db.query(`
      SELECT 
        canal,
        COUNT(*) as total_ventas,
        SUM(total) as ingresos
      FROM ventas
      GROUP BY canal
      ORDER BY ingresos DESC
    `);

    // Total de pedidos por canal
    const [pedidosPorCanal] = await db.query(`
      SELECT 
        canal,
        COUNT(*) as total_pedidos,
        estado
      FROM pedidos
      GROUP BY canal, estado
    `);

    // Productos más vendidos por canal
    const [productosPorCanal] = await db.query(`
      SELECT 
        v.canal,
        CONCAT(p.nombre, ' - ', p.descripcion) as producto,
        SUM(dv.cantidad) as cantidad_vendida
      FROM ventas v
      JOIN detalle_venta dv ON v.id_venta = dv.id_venta
      JOIN productos p ON dv.id_producto = p.id_producto
      GROUP BY v.canal, p.id_producto
      ORDER BY v.canal, cantidad_vendida DESC
    `);

    // Inventario crítico (stock bajo)
    const [inventarioCritico] = await db.query(`
      SELECT 
        CONCAT(nombre, ' - ', descripcion, ' (', talla, ', ', color, ')') as producto,
        cantidad
      FROM productos
      WHERE cantidad < 10
      ORDER BY cantidad ASC
      LIMIT 10
    `);

    // Devoluciones pendientes
    const [[devolucionesPendientes]] = await db.query(`
      SELECT COUNT(*) as total 
      FROM devoluciones 
      WHERE estado = 'Pendiente'
    `);

    res.json({
      ventasPorCanal,
      pedidosPorCanal,
      productosPorCanal,
      inventarioCritico,
      devolucionesPendientes: devolucionesPendientes.total || 0
    });

  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: "Error al obtener dashboard" });
  }
});

// ========================================
// 🔹 INVENTARIO EN TIEMPO REAL
// ========================================
router.get("/inventario", async (req, res) => {
  try {
    const [inventario] = await db.query(`
      SELECT 
        id_producto,
        CONCAT(nombre, ' - ', descripcion, ' (', talla, ', ', color, ')') as producto_completo,
        nombre,
        categoria,
        cantidad,
        precio,
        CASE 
          WHEN cantidad = 0 THEN 'Agotado'
          WHEN cantidad < 5 THEN 'Crítico'
          WHEN cantidad < 10 THEN 'Bajo'
          ELSE 'Normal'
        END as estado_stock
      FROM productos
      ORDER BY cantidad ASC
    `);

    res.json(inventario);
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: "Error al obtener inventario" });
  }
});

// ========================================
// 🔹 VENTAS POR CANAL
// ========================================
router.get("/ventas", async (req, res) => {
  try {
    const { canal, desde, hasta } = req.query;

    let sql = `
      SELECT 
        v.id_venta,
        v.canal,
        c.nombre as cliente,
        v.fecha_venta,
        v.total,
        GROUP_CONCAT(
          CONCAT(p.nombre, ' x', dv.cantidad)
          SEPARATOR ', '
        ) as productos
      FROM ventas v
      LEFT JOIN clientes c ON v.id_cliente = c.id_cliente
      LEFT JOIN detalle_venta dv ON v.id_venta = dv.id_venta
      LEFT JOIN productos p ON dv.id_producto = p.id_producto
      WHERE 1=1
    `;

    const params = [];

    if (canal) {
      sql += " AND v.canal = ?";
      params.push(canal);
    }

    if (desde) {
      sql += " AND DATE(v.fecha_venta) >= ?";
      params.push(desde);
    }

    if (hasta) {
      sql += " AND DATE(v.fecha_venta) <= ?";
      params.push(hasta);
    }

    sql += " GROUP BY v.id_venta ORDER BY v.fecha_venta DESC";

    const [ventas] = await db.query(sql, params);
    res.json(ventas);

  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: "Error al obtener ventas" });
  }
});

// ========================================
// 🔹 PEDIDOS POR CANAL
// ========================================
router.get("/pedidos", async (req, res) => {
  try {
    const { canal, estado } = req.query;

    let sql = `
      SELECT 
        p.id_pedido,
        p.canal,
        c.nombre as cliente,
        p.fecha_pedido,
        p.fecha_entrega,
        p.estado,
        p.total,
        GROUP_CONCAT(
          CONCAT(pr.nombre, ' x', dp.cantidad)
          SEPARATOR ', '
        ) as productos
      FROM pedidos p
      LEFT JOIN clientes c ON p.id_cliente = c.id_cliente
      LEFT JOIN detalle_pedido dp ON p.id_pedido = dp.id_pedido
      LEFT JOIN productos pr ON dp.id_producto = pr.id_producto
      WHERE 1=1
    `;

    const params = [];

    if (canal) {
      sql += " AND p.canal = ?";
      params.push(canal);
    }

    if (estado) {
      sql += " AND p.estado = ?";
      params.push(estado);
    }

    sql += " GROUP BY p.id_pedido ORDER BY p.fecha_pedido DESC";

    const [pedidos] = await db.query(sql, params);
    res.json(pedidos);

  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: "Error al obtener pedidos" });
  }
});

// ========================================
// 🔹 DEVOLUCIONES
// ========================================

// Obtener todas las devoluciones
router.get("/devoluciones", async (req, res) => {
  try {
    const [devoluciones] = await db.query(`
      SELECT 
        d.id_devolucion,
        d.id_venta,
        v.canal,
        c.nombre as cliente,
        d.fecha_devolucion,
        d.motivo,
        d.estado,
        GROUP_CONCAT(
          CONCAT(p.nombre, ' - ', p.descripcion, ' x', dd.cantidad)
          SEPARATOR ', '
        ) as productos_devueltos
      FROM devoluciones d
      JOIN ventas v ON d.id_venta = v.id_venta
      LEFT JOIN clientes c ON v.id_cliente = c.id_cliente
      LEFT JOIN detalle_devolucion dd ON d.id_devolucion = dd.id_devolucion
      LEFT JOIN productos p ON dd.id_producto = p.id_producto
      GROUP BY d.id_devolucion
      ORDER BY d.fecha_devolucion DESC
    `);

    res.json(devoluciones);
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: "Error al obtener devoluciones" });
  }
});

// Crear devolución
router.post("/devoluciones", async (req, res) => {
  try {
    const { id_venta, productos, motivo } = req.body;

    if (!id_venta || !productos || productos.length === 0) {
      return res.status(400).json({ error: "Venta y productos son obligatorios" });
    }

    // Verificar que la venta existe
    const [venta] = await db.query(
      "SELECT id_venta FROM ventas WHERE id_venta = ?",
      [id_venta]
    );

    if (venta.length === 0) {
      return res.status(404).json({ error: "Venta no encontrada" });
    }

    // Crear devolución
    const [resultDevolucion] = await db.query(
      "INSERT INTO devoluciones (id_venta, id_usuario, motivo, estado) VALUES (?, ?, ?, 'Pendiente')",
      [id_venta, 1, motivo || null]
    );

    // Insertar productos devueltos
    for (const prod of productos) {
      await db.query(
        "INSERT INTO detalle_devolucion (id_devolucion, id_producto, cantidad) VALUES (?, ?, ?)",
        [resultDevolucion.insertId, prod.id_producto, prod.cantidad]
      );
    }

    res.json({
      mensaje: "✅ Devolución registrada. Pendiente de aprobación.",
      id: resultDevolucion.insertId
    });

  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: "Error al crear devolución: " + error.message });
  }
});

// Aprobar/Rechazar devolución
router.patch("/devoluciones/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { accion } = req.body; // 'aprobar' o 'rechazar'

    if (!['aprobar', 'rechazar'].includes(accion)) {
      return res.status(400).json({ error: "Acción no válida" });
    }

    const nuevoEstado = accion === 'aprobar' ? 'Aprobada' : 'Rechazada';

    // Si se aprueba, devolver productos al inventario
    if (accion === 'aprobar') {
      const [productos] = await db.query(
        "SELECT id_producto, cantidad FROM detalle_devolucion WHERE id_devolucion = ?",
        [id]
      );

      for (const prod of productos) {
        await db.query(
          "UPDATE productos SET cantidad = cantidad + ? WHERE id_producto = ?",
          [prod.cantidad, prod.id_producto]
        );
      }
    }

    // Actualizar estado
    await db.query(
      "UPDATE devoluciones SET estado = ? WHERE id_devolucion = ?",
      [nuevoEstado, id]
    );

    res.json({
      mensaje: `✅ Devolución ${nuevoEstado.toLowerCase()}${accion === 'aprobar' ? '. Inventario actualizado.' : '.'}`
    });

  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: "Error al procesar devolución" });
  }
});

// ========================================
// 🔹 COMPARATIVA DE CANALES
// ========================================
router.get("/comparativa", async (req, res) => {
  try {
    const { desde, hasta } = req.query;

    let sql = `
      SELECT 
        canal,
        COUNT(*) as total_ventas,
        SUM(total) as ingresos_totales,
        AVG(total) as ticket_promedio,
        COUNT(DISTINCT id_cliente) as clientes_unicos
      FROM ventas
      WHERE 1=1
    `;

    const params = [];

    if (desde) {
      sql += " AND DATE(fecha_venta) >= ?";
      params.push(desde);
    }

    if (hasta) {
      sql += " AND DATE(fecha_venta) <= ?";
      params.push(hasta);
    }

    sql += " GROUP BY canal ORDER BY ingresos_totales DESC";

    const [comparativa] = await db.query(sql, params);
    res.json(comparativa);

  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: "Error al obtener comparativa" });
  }
});

export default router;