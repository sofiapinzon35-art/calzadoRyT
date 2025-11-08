// ✅ Conexión a MySQL con soporte para Promesas
import mysql from "mysql2/promise";

let db;

try {
  db = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "@John1496", // Tu contraseña actual
    database: "calzado_ryt",
  });

  console.log("✅ Conexión exitosa a MySQL (calzado_ryt)");
} catch (error) {
  console.error("❌ Error al conectar con la base de datos:", error);
}

// Exportamos la conexión lista para usar
export { db };







