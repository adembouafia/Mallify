const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");

dotenv.config();
const app = express();

app.use(cors(
  {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"]
  }
));

app.use(helmet());

app.use(express.json());

mongoose
  .connect(process.env.DB_URL) 
  .then(() => console.log("Connexion à MongoDB réussie !"))
  .catch((err) => console.error("Erreur de connexion :", err));

  require("./app/routes/client.routes")(app);
  require("./app/routes/vendor.routes")(app);
  require("./app/routes/product.routes")(app);

const PORT = process.env.PORT || 7000;
app.listen(PORT, () => console.log(`Serveur en cours d'exécution sur le port ${PORT}`));
