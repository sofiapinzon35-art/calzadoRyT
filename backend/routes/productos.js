import express from "express";
import { db } from "../db.js"; // conexión a MySQL (ya configurada con promise)

const router = express.Router();

// =============================
// 🔹 Obtener todos los productos
// =============================
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM productos");
    res.json(rows);
  } catch (error) {
    console.error("❌ Error al obtener productos:", error);
    res.status(500).json({ error: "Error al obtener productos" });
  }
});

// =============================
// 🔹 Agregar nuevo producto
// =============================
router.post("/", async (req, res) => {
  try {
    const { nombre, descripcion, talla, color, categoria, precio, cantidad } = req.body;

    // Validar campos vacíos
    if (!nombre || !descripcion || !talla || !color || !categoria || !precio || !cantidad) {
      return res.status(400).json({ error: "Todos los campos son obligatorios." });
    }

    const sql = `
      INSERT INTO productos (nombre, descripcion, talla, color, categoria, precio, cantidad, fecha_registro)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const [result] = await db.query(sql, [nombre, descripcion, talla, color, categoria, precio, cantidad]);

    res.json({ mensaje: "✅ Producto registrado correctamente", id: result.insertId });
  } catch (error) {
    console.error("❌ Error al registrar producto:", error);
    res.status(500).json({ error: "Error al registrar producto" });
  }
});

// =============================
// 🔹 Actualizar producto existente
// =============================
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, talla, color, categoria, precio, cantidad } = req.body;

    // 🔸 Aseguramos que no lleguen valores nulos o vacíos
    if (
      !nombre?.trim() ||
      !descripcion?.trim() ||
      !talla?.trim() ||
      !color?.trim() ||
      !categoria?.trim() ||
      precio == null ||
      cantidad == null
    ) {
      return res.status(400).json({ error: "Todos los campos son obligatorios para actualizar." });
    }

    const sql = `
      UPDATE productos
      SET nombre = ?, descripcion = ?, talla = ?, color = ?, categoria = ?, precio = ?, cantidad = ?
      WHERE id_producto = ?
    `;

    const [result] = await db.query(sql, [
      nombre.trim(),
      descripcion.trim(),
      talla.trim(),
      color.trim(),
      categoria.trim(),
      precio,
      cantidad,
      id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Producto no encontrado." });
    }

    res.json({ mensaje: "✅ Producto actualizado correctamente" });
  } catch (error) {
    console.error("❌ Error al actualizar producto:", error);
    res.status(500).json({ error: "Error al actualizar producto" });
  }
});

// =============================
// 🔹 Eliminar producto
// =============================
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query("DELETE FROM productos WHERE id_producto = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    res.json({ mensaje: "🗑️ Producto eliminado correctamente" });
  } catch (error) {
    console.error("❌ Error al eliminar producto:", error);
    res.status(500).json({ error: "Error al eliminar producto" });
  }
});

export default router;





