const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();
const app = express();

app.use(express.json());

mongoose
  .connect(process.env.DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connexion à MongoDB réussie !"))
  .catch((err) => console.error("Erreur de connexion :", err));

app.use("/clients/register" , require("./app/routes/client.routes"));


const PORT = process.env.PORT || 7000;
app.listen(PORT, () => console.log(`Serveur en cours d'exécution sur le port ${PORT}`));