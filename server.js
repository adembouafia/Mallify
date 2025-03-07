const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.DB_URL) // Assure-toi que DB_URL est bien défini dans ton fichier .env
  .then(() => console.log("Connexion à MongoDB réussie !"))
  .catch((err) => console.error("Erreur de connexion :", err));

const PORT = process.env.PORT || 7000;
app.listen(PORT, () => console.log(`Serveur en cours d'exécution sur le port ${PORT}`));
