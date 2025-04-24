const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");

dotenv.config();
const app = express();

app.use(cors(
  {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"]
  }
));

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'unsafe-inline'"],
    },
  },
}));

app.use(express.json());

app.use(express.static(path.join(__dirname, "frontend" )));
app.use('/assets', express.static(path.join(__dirname, "assets")));

app.use('/uploads', express.static('uploads')); 

app.use((req , res, next ) => {
  console.log(`request made to ${req.url}`);
  next();
});

app.get("/", (req, res) => {
  res.sendFile(Path.join(__dirname, "frontend" ,"index.html"));
});

mongoose
  .connect(process.env.DB_URL) 
  .then(() => console.log("Connexion à MongoDB réussie !"))
  .catch((err) => console.error("Erreur de connexion :", err));

  require("./app/routes/client.routes")(app);
  require("./app/routes/vendor.routes")(app);
  require("./app/routes/product.routes")(app);
  require("./app/routes/shop.routes")(app);
  require("./app/routes/category.routes")(app);
  require("./app/routes/subCategory.routes")(app);
  require("./app/routes/cart.routes")(app);
  require("./app/routes/order.routes")(app);
  require("./app/routes/delivery.routes")(app);
  require("./app/routes/favoris.routes")(app);

const PORT = process.env.PORT || 7000;
app.listen(PORT, () => console.log(`Serveur en cours d'exécution sur le port ${PORT}`));
