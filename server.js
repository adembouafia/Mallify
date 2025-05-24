const express = require("express")
const mongoose = require("mongoose")
const dotenv = require("dotenv")
const cors = require("cors")
const helmet = require("helmet")
const path = require("path")
const fs = require("fs")
const https = require("https")

// Load environment variables FIRST
dotenv.config()

console.log("=== Server Starting ===")
console.log("Environment variables loaded")

const app = express()

// Basic middleware
app.use(express.json({ limit: "100mb" }))
app.use(express.urlencoded({ extended: true, limit: "100mb" }))

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
)

// Debug middleware to log request details
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  next()
})

// Load and initialize passport AFTER environment variables are loaded
console.log("Loading passport configuration...")
let passport
try {
  passport = require("./app/config/passport")
  app.use(passport.initialize())
  console.log("✅ Passport initialized successfully")
} catch (error) {
  console.error("❌ Error loading/initializing passport:", error)
  process.exit(1)
}

// Serve static files
app.use(
  "/assets",
  express.static(path.join(__dirname, "assets"), {
    setHeaders: (res, path) => {
      if (path.endsWith(".css")) {
        res.setHeader("Content-Type", "text/css")
      } else if (path.endsWith(".js")) {
        res.setHeader("Content-Type", "application/javascript")
      }
    },
  }),
)

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    setHeaders: (res, path) => {
      res.setHeader("Access-Control-Allow-Origin", "*")
    },
  }),
)

// Simplified Helmet configuration
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
  }),
)

// Serve frontend static files
app.use(
  express.static(path.join(__dirname, "frontend"), {
    setHeaders: (res, path) => {
      if (path.endsWith(".css")) {
        res.setHeader("Content-Type", "text/css")
      } else if (path.endsWith(".js")) {
        res.setHeader("Content-Type", "application/javascript")
      }
    },
  }),
)

// Connect to MongoDB
mongoose
  .connect(process.env.DB_URL)
  .then(() => console.log("✅ MongoDB connection successful"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err)
  })

// Load OAuth routes FIRST
console.log("Loading OAuth routes...")
try {
  require("./app/routes/auth.routes")(app)
  console.log("✅ OAuth routes loaded successfully")
} catch (error) {
  console.error("❌ Error loading OAuth routes:", error)
}

// Load other routes
const routes = [
  "./app/routes/client.routes",
  "./app/routes/admin.routes",
  "./app/routes/cart.routes",
  "./app/routes/category.routes",
  "./app/routes/delivery.routes",
  "./app/routes/favoris.routes",
  "./app/routes/invoice.routes",
  "./app/routes/moderator.routes",
  "./app/routes/notification.routes",
  "./app/routes/order.routes",
  "./app/routes/product.routes",
  "./app/routes/report.routes",
  "./app/routes/shop.routes",
  "./app/routes/subCategory.routes",
  "./app/routes/vendor.routes",
]

routes.forEach((routePath) => {
  try {
    require(routePath)(app)
    console.log(`✅ Loaded: ${routePath}`)
  } catch (error) {
    console.error(`❌ Error loading ${routePath}:`, error.message)
  }
})

// Route handler for HTML files
app.get("/:page.html", (req, res) => {
  const page = req.params.page
  const filePath = path.join(__dirname, "frontend", `${page}.html`)

  try {
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath)
    } else {
      res.status(404).send("Page not found")
    }
  } catch (err) {
    console.error(`Error serving ${filePath}:`, err)
    res.status(500).send("Server error")
  }
})

// Default route
app.get("/", (req, res) => {
  try {
    res.sendFile(path.join(__dirname, "frontend", "index.html"))
  } catch (err) {
    console.error("Error serving index.html:", err)
    res.status(500).send("Error loading homepage")
  }
})

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  console.error("=== Server Error ===")
  console.error("URL:", req.url)
  console.error("Method:", req.method)
  console.error("Error:", err.message)
  console.error("Stack:", err.stack)
  console.error("=== End Error ===")

  res.status(500).json({
    error: "Internal Server Error",
    message: process.env.NODE_ENV === "development" ? err.message : "Something went wrong",
    timestamp: new Date().toISOString(),
  })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📱 Local: http://localhost:${PORT}`)
  console.log(`🔐 Test OAuth: http://localhost:${PORT}/auth/test`)
  console.log("=== Server Ready ===")
})
