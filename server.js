const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const fs = require('fs');

dotenv.config();
const app = express();

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

app.use(
  cors({
    origin: "*",
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Debug middleware to log request details
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Serve static files with proper MIME types
app.use('/assets', express.static(path.join(__dirname, "assets"), {
  setHeaders: (res, path) => {
    if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.endsWith('.png') || path.endsWith('.jpg') || path.endsWith('.jpeg') || path.endsWith('.gif')) {
      res.setHeader('Content-Type', 'image/' + path.split('.').pop());
    }
  }
}));

app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, path) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
}));

// Helmet configuration
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'", 
          "'unsafe-inline'", 
          "'unsafe-eval'", 
          "cdnjs.cloudflare.com", 
          "*.cloudflare.com", 
          "code.jquery.com", 
          "*.googleapis.com", 
          "*.gstatic.com",
          "cdn.jsdelivr.net",
          "*.jsdelivr.net",
          "ajax.googleapis.com",
          "unpkg.com",
          "*.unpkg.com"
        ],
        scriptSrcAttr: ["'unsafe-inline'"], 
        scriptSrcElem: [
          "'self'", 
          "'unsafe-inline'", 
          "'unsafe-eval'", 
          "cdnjs.cloudflare.com", 
          "*.cloudflare.com", 
          "code.jquery.com", 
          "*.googleapis.com", 
          "*.gstatic.com",
          "cdn.jsdelivr.net",
          "*.jsdelivr.net",
          "ajax.googleapis.com",
          "unpkg.com",
          "*.unpkg.com"
        ],
        styleSrc: [
          "'self'", 
          "'unsafe-inline'", 
          "cdnjs.cloudflare.com", 
          "*.cloudflare.com", 
          "*.googleapis.com", 
          "*.gstatic.com",
          "cdn.jsdelivr.net",
          "*.jsdelivr.net",
          "unpkg.com",
          "*.unpkg.com"
        ],
        styleSrcElem: [
          "'self'", 
          "'unsafe-inline'", 
          "cdnjs.cloudflare.com", 
          "*.cloudflare.com", 
          "*.googleapis.com", 
          "*.gstatic.com",
          "cdn.jsdelivr.net",
          "*.jsdelivr.net",
          "unpkg.com",
          "*.unpkg.com"
        ],
        fontSrc: [
          "'self'", 
          "cdnjs.cloudflare.com", 
          "*.cloudflare.com", 
          "*.googleapis.com", 
          "*.gstatic.com", 
          "cdn.jsdelivr.net",
          "*.jsdelivr.net",
          "unpkg.com",
          "*.unpkg.com",
          "data:"
        ],
        imgSrc: ["'self'", "http://localhost:3000", "data:", "blob:", "*"],
        connectSrc: ["'self'", "ws:", "wss:", "*"],
        frameSrc: ["'self'", ".youtube.com", ".google.com"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'", "data:", "blob:"],
        workerSrc: ["'self'", "blob:"]
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false
  })
);

// Serve frontend static files
app.use(express.static(path.join(__dirname, "frontend")));

// Connect to MongoDB
mongoose
  .connect(process.env.DB_URL)
  .then(() => console.log("Connexion à MongoDB réussie !"))
  .catch((err) => console.error("Erreur de connexion :", err));

// IMPORTANT: Load API routes first, before the HTML routes
// This ensures API routes take precedence over static page routes
require("./app/routes/admin.routes")(app);
require("./app/routes/cart.routes")(app);
require("./app/routes/client.routes")(app);
require("./app/routes/category.routes")(app);
require("./app/routes/delivery.routes")(app);
require("./app/routes/favoris.routes")(app);
require("./app/routes/invoice.routes")(app);
require("./app/routes/moderator.routes")(app);
require("./app/routes/notification.routes")(app);
require("./app/routes/order.routes")(app);
require("./app/routes/product.routes")(app);
require("./app/routes/report.routes")(app);
require("./app/routes/shop.routes")(app);
require("./app/routes/subCategory.routes")(app);
require("./app/routes/vendor.routes")(app);

// Special handling for missing user images - provide fallback
app.use((req, res, next) => {
  if (req.url.match(/user\d+-\d+x\d+\.jpg/) || req.url.includes('default-150x150.png')) {
    // Check if the file exists in assets/images directory
    const imagePath = path.join(__dirname, 'assets', 'images', path.basename(req.url));
    
    if (fs.existsSync(imagePath)) {
      return res.sendFile(imagePath);
    } else {
      // If not found, send a default placeholder image
      const defaultImagePath = path.join(__dirname, 'assets', 'images', 'default-avatar.png');
      if (fs.existsSync(defaultImagePath)) {
        return res.sendFile(defaultImagePath);
      } else {
        // If default avatar doesn't exist, return a 404
        return res.status(404).send('Image not found');
      }
    }
  }
  next();
});

// Route handler for all HTML files in the frontend directory
app.get("/:page.html", (req, res) => {
  const page = req.params.page;
  const filePath = path.join(__dirname, "frontend", `${page}.html`);
  
  try {
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).send('Page not found');
    }
  } catch (err) {
    console.error(`Error serving ${filePath}:`, err);
    res.status(500).send('Server error');
  }
});

// Default route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

// Dashboard routes
app.get("/dashboard/:page", (req, res) => {
  const page = req.params.page;
  const filePath = path.join(__dirname, "frontend", "dashboardOut_pages", `${page}.html`);
  
  try {
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).send('Dashboard page not found');
    }
  } catch (err) {
    console.error(`Error serving dashboard page ${page}:`, err);
    res.status(500).send('Server error');
  }
});

// Admin dashboard routes - MOVED AFTER API ROUTES to prevent route conflicts
app.get("/admin/:page", (req, res) => {
  const page = req.params.page;
  const filePath = path.join(__dirname, "frontend", "dashboardA_pages", `${page}.html`);
  
  try {
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).send('Admin page not found');
    }
  } catch (err) {
    console.error(`Error serving admin page ${page}:`, err);
    res.status(500).send('Server error');
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).send('Something broke on the server!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Serveur en cours d'exécution sur le port ${PORT}`)
);