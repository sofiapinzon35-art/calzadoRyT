import express from "express";
import cors from "cors";
import { db } from "./db.js";

import productosRoutes from "./routes/productos.js";
import usuariosRoutes from "./routes/usuarios.js";
import ventasRoutes from "./routes/ventas.js";
import gestionUsuariosRoutes from "./routes/gestionUsuarios.js";
import pedidosRoutes from "./routes/pedidos.js";
import reportesRoutes from "./routes/reportes.js";
import reabastecimientoRoutes from "./routes/reabastecimiento.js";
import integracionRoutes from "./routes/integracion.js"; // ✅ Módulo de integración de canales

const app = express();

app.use(cors());
app.use(express.json());

// ✅ Rutas principales
app.use("/api/productos", productosRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/ventas", ventasRoutes);
app.use("/api/gestionUsuarios", gestionUsuariosRoutes);
app.use("/api/pedidos", pedidosRoutes);
app.use("/api/reportes", reportesRoutes);
app.use("/api/reabastecimiento", reabastecimientoRoutes);
app.use("/api/integracion", integracionRoutes); // ✅ Integración de canales

// ✅ Ruta raíz
app.get("/", (req, res) => {
  res.send("Servidor de Calzado RyT corriendo correctamente 🟢");
});

// ✅ Iniciar servidor
app.listen(3000, async () => {
  console.log("🚀 Servidor activo en http://localhost:3000");

  try {
    const [rows] = await db.query("SELECT 1");
    console.log("✅ Conexión exitosa a MySQL (calzado_ryt)");
  } catch (err) {
    console.error("❌ Error al conectar con la base de datos:", err);
  }
});




