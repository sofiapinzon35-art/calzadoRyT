import express from "express";
import { db } from "../db.js";

const router = express.Router();

// ✅ Obtener todos los usuarios
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM usuarios");
    res.json(rows);
  } catch (err) {
    console.error("❌ Error al obtener usuarios:", err);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});

// ✅ Agregar usuario
router.post("/", async (req, res) => {
  const { nombre, correo, contrasena, rol } = req.body;

  try {
    if (!nombre || !contrasena || !rol) {
      return res.status(400).json({ error: "Faltan datos requeridos" });
    }

    const [result] = await db.query(
      "INSERT INTO usuarios (nombre, correo, contrasena, rol, fecha_registro) VALUES (?, ?, ?, ?, NOW())",
      [nombre, correo || "", contrasena, rol]
    );

    res.json({
      mensaje: "✅ Usuario agregado correctamente",
      id_usuario: result.insertId,
    });
  } catch (err) {
    console.error("❌ Error al agregar usuario:", err);
    res.status(500).json({ error: "Error al agregar usuario" });
  }
});

// ✅ Eliminar usuario
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query("DELETE FROM usuarios WHERE id_usuario = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.json({ mensaje: "🗑️ Usuario eliminado correctamente" });
  } catch (err) {
    console.error("❌ Error al eliminar usuario:", err);
    res.status(500).json({ error: "Error al eliminar usuario" });
  }
});

export default router;


