import express from "express";
import { db } from "../db.js";

const router = express.Router();

// 🔹 LOGIN DE USUARIOS (compatible con mysql2/promise)
router.post("/login", async (req, res) => {
  const { nombre, contrasena } = req.body;

  if (!nombre || !contrasena) {
    return res.status(400).json({ mensaje: "Faltan datos." });
  }

  try {
    // Consulta con await, usando la conexión tipo promesa
    const [results] = await db.query(
      "SELECT * FROM usuarios WHERE nombre = ? AND contrasena = ?",
      [nombre, contrasena]
    );

    if (results.length === 0) {
      return res.status(401).json({ mensaje: "Usuario o contraseña incorrectos." });
    }

    const usuario = results[0];
    res.json({
      mensaje: "Inicio de sesión exitoso.",
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        rol: usuario.rol
      }
    });
  } catch (error) {
    console.error("❌ Error al verificar usuario:", error);
    res.status(500).json({ mensaje: "Error interno del servidor." });
  }
});

export default router;















