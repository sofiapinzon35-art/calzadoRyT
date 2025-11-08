// ✅ routes/reportes.js
import express from "express";
import { db } from "../db.js";

const router = express.Router();

// =========================================
// 🔹 Endpoint: obtener filtros (productos y clientes)
// =========================================
router.get("/filters", async (req, res) => {
  try {
    // Obtener productos únicos (sin duplicados de variantes)
    const [productos] = await db.query(`
      SELECT DISTINCT 
        id_producto AS id, 
        CONCAT(nombre, ' - ', descripcion, ' (', talla, ', ', color, ')') AS nombre 
      FROM productos 
      ORDER BY nombre
    `);
    
    const [clientes] = await db.query(
      "SELECT id_cliente AS id, nombre FROM clientes ORDER BY nombre"
    );

    res.json({ productos, clientes });
  } catch (error) {
    console.error("❌ Error al obtener filtros:", error);
    res.status(500).json({ error: "Error al obtener filtros" });
  }
});

// =========================================
// 🔹 Endpoint: generar reporte de ventas
// =========================================
router.get("/report", async (req, res) => {
  try {
    const { producto, cliente, from, to, format = "chart" } = req.query;

    const where = [];
    const params = [];

    if (producto) {
      where.push("dv.id_producto = ?");
      params.push(producto);
    }
    if (cliente) {
      where.push("v.id_cliente = ?");
      params.push(cliente);
    }
    if (from) {
      where.push("DATE(v.fecha_venta) >= ?");
      params.push(from);
    }
    if (to) {
      where.push("DATE(v.fecha_venta) <= ?");
      params.push(to);
    }

    const whereSql = where.length ? "WHERE " + where.join(" AND ") : "";

    // 🔸 Formato tabla detallado
    if (format === "table") {
      const sql = `
        SELECT 
          CONCAT(p.nombre, ' - ', p.descripcion, ' (', p.talla, ', ', p.color, ')') AS producto,
          p.categoria,
          c.nombre AS cliente,
          DATE_FORMAT(v.fecha_venta, '%Y-%m-%d %H:%i') AS fecha,
          dv.cantidad,
          FORMAT(dv.precio_unitario, 2) AS precio_unitario,
          FORMAT(dv.subtotal, 2) AS subtotal,
          FORMAT(v.total, 2) AS total_venta
        FROM ventas v
        JOIN detalle_venta dv ON v.id_venta = dv.id_venta
        JOIN productos p ON dv.id_producto = p.id_producto
        JOIN clientes c ON v.id_cliente = c.id_cliente
        ${whereSql}
        ORDER BY v.fecha_venta DESC
      `;
      const [rows] = await db.query(sql, params);
      return res.json({ data: rows });
    }

    // 🔸 Formato gráfico (puedes elegir qué mostrar)
    // Por defecto: ventas por producto
    if (!producto && !cliente) {
      // Vista general: ventas por producto
      const sql = `
        SELECT 
          CONCAT(p.nombre, ' - ', p.descripcion) AS label,
          SUM(dv.cantidad) AS value
        FROM ventas v
        JOIN detalle_venta dv ON v.id_venta = dv.id_venta
        JOIN productos p ON dv.id_producto = p.id_producto
        ${whereSql}
        GROUP BY p.id_producto, p.nombre, p.descripcion
        ORDER BY value DESC
        LIMIT 10
      `;
      const [rows] = await db.query(sql, params);

      return res.json({
        data: rows,
        labels: rows.map(r => r.label),
        seriesLabel: "Cantidad vendida por producto (Top 10)"
      });
    }

    // Si hay filtros específicos: mostrar por fecha
    const sql = `
      SELECT 
        DATE_FORMAT(v.fecha_venta, '%Y-%m-%d') AS label,
        SUM(v.total) AS value
      FROM ventas v
      JOIN detalle_venta dv ON v.id_venta = dv.id_venta
      JOIN productos p ON dv.id_producto = p.id_producto
      ${whereSql}
      GROUP BY DATE(v.fecha_venta)
      ORDER BY DATE(v.fecha_venta)
    `;
    const [rows] = await db.query(sql, params);

    res.json({
      data: rows,
      labels: rows.map(r => r.label),
      seriesLabel: "Ventas por día ($)"
    });

  } catch (error) {
    console.error("❌ Error al generar reporte:", error);
    res.status(500).json({ error: "Error al generar reporte" });
  }
});

// =========================================
// 🔹 Endpoint: estadísticas generales (opcional)
// =========================================
router.get("/stats", async (req, res) => {
  try {
    // Total de ventas
    const [[totalVentas]] = await db.query(`
      SELECT COUNT(*) AS total FROM ventas
    `);

    // Ingresos totales
    const [[ingresosTotales]] = await db.query(`
      SELECT SUM(total) AS ingresos FROM ventas
    `);

    // Producto más vendido
    const [[productoTop]] = await db.query(`
      SELECT 
        CONCAT(p.nombre, ' - ', p.descripcion) AS producto,
        SUM(dv.cantidad) AS cantidad
      FROM detalle_venta dv
      JOIN productos p ON dv.id_producto = p.id_producto
      GROUP BY p.id_producto
      ORDER BY cantidad DESC
      LIMIT 1
    `);

    // Cliente con más compras
    const [[clienteTop]] = await db.query(`
      SELECT 
        c.nombre AS cliente,
        COUNT(v.id_venta) AS compras,
        SUM(v.total) AS total_gastado
      FROM ventas v
      JOIN clientes c ON v.id_cliente = c.id_cliente
      GROUP BY c.id_cliente
      ORDER BY compras DESC
      LIMIT 1
    `);

    res.json({
      totalVentas: totalVentas.total || 0,
      ingresosTotales: ingresosTotales.ingresos || 0,
      productoMasVendido: productoTop || null,
      mejorCliente: clienteTop || null
    });

  } catch (error) {
    console.error("❌ Error al obtener estadísticas:", error);
    res.status(500).json({ error: "Error al obtener estadísticas" });
  }
});

export default router;





