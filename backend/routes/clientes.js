import express from "express";
import { db } from "../db.js";

const router = express.Router();

// Obtener todos los clientes
router.get("/", (req, res) => {
  const sql = "SELECT * FROM clientes";
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

// Agregar un nuevo cliente
router.post("/", (req, res) => {
  const { nombre, telefono, correo, direccion } = req.body;
  const sql = "INSERT INTO clientes (nombre, telefono, correo, direccion) VALUES (?, ?, ?, ?)";
  db.query(sql, [nombre, telefono, correo, direccion], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ mensaje: "✅ Cliente agregado correctamente" });
  });
});

// Actualizar un cliente
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { nombre, telefono, correo, direccion } = req.body;
  const sql = "UPDATE clientes SET nombre=?, telefono=?, correo=?, direccion=? WHERE id_cliente=?";
  db.query(sql, [nombre, telefono, correo, direccion, id], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ mensaje: "✅ Cliente actualizado correctamente" });
  });
});

// Eliminar un cliente
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM clientes WHERE id_cliente=?";
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ mensaje: "🗑️ Cliente eliminado correctamente" });
  });
});

export default router;
