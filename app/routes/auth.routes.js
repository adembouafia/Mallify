const passport = require("../config/passport")
const jwt = require("jsonwebtoken")

module.exports = (app) => {
  console.log("=== Setting up OAuth routes ===")

  // Test route to verify auth routes are working
  app.get("/auth/test", (req, res) => {
    res.json({
      message: "Auth routes are working",
      strategies: Object.keys(passport._strategies || {}),
      timestamp: new Date().toISOString(),
    })
  })

  // Google OAuth routes (only if Google credentials are configured)
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    console.log("🔧 Setting up Google OAuth routes...")

    app.get("/auth/google", (req, res, next) => {
      console.log("Google OAuth route accessed")
      passport.authenticate("google", {
        scope: ["profile", "email"],
        session: false,
      })(req, res, next)
    })

    app.get(
      "/auth/google/callback",
      passport.authenticate("google", {
        failureRedirect: "/account.html?error=google_auth_failed",
        session: false,
      }),
      async (req, res) => {
        try {
          console.log("Google OAuth callback successful for user:", req.user._id)

          // Generate JWT token
          const token = jwt.sign(
            {
              id: req.user._id,
              email: req.user.email,
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" },
          )

          // Redirect to frontend with token and user data
          const redirectUrl = `/account.html?oauth_success=true&token=${token}&user=${encodeURIComponent(
            JSON.stringify({
              id: req.user._id,
              firstname: req.user.firstname,
              lastname: req.user.lastname,
              email: req.user.email,
              profilePicture: req.user.profilePicture,
              authProvider: req.user.authProvider,
            }),
          )}`

          res.redirect(redirectUrl)
        } catch (error) {
          console.error("Google OAuth callback error:", error)
          res.redirect("/account.html?error=oauth_callback_failed")
        }
      },
    )
    console.log("✅ Google OAuth routes configured")
  } else {
    console.log("⚠️  Google OAuth routes not configured - missing credentials")

    // Fallback routes when Google OAuth is not configured
    app.get("/auth/google", (req, res) => {
      console.log("Google OAuth not configured, redirecting with error")
      res.redirect("/account.html?error=google_not_configured")
    })

    app.get("/auth/google/callback", (req, res) => {
      res.redirect("/account.html?error=google_not_configured")
    })
  }

  // Facebook OAuth routes (only if Facebook credentials are configured)
  if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    console.log("🔧 Setting up Facebook OAuth routes...")

    app.get("/auth/facebook", (req, res, next) => {
      console.log("Facebook OAuth route accessed")
      passport.authenticate("facebook", {
        scope: ["email", "public_profile"],
        session: false,
      })(req, res, next)
    })

    app.get(
      "/auth/facebook/callback",
      passport.authenticate("facebook", {
        failureRedirect: "/account.html?error=facebook_auth_failed",
        session: false,
      }),
      async (req, res) => {
        try {
          console.log("Facebook OAuth callback successful for user:", req.user._id)

          // Generate JWT token
          const token = jwt.sign(
            {
              id: req.user._id,
              email: req.user.email,
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" },
          )

          // Redirect to frontend with token and user data
          const redirectUrl = `/account.html?oauth_success=true&token=${token}&user=${encodeURIComponent(
            JSON.stringify({
              id: req.user._id,
              firstname: req.user.firstname,
              lastname: req.user.lastname,
              email: req.user.email,
              profilePicture: req.user.profilePicture,
              authProvider: req.user.authProvider,
            }),
          )}`

          res.redirect(redirectUrl)
        } catch (error) {
          console.error("Facebook OAuth callback error:", error)
          res.redirect("/account.html?error=oauth_callback_failed")
        }
      },
    )
    console.log("✅ Facebook OAuth routes configured")
  } else {
    console.log("⚠️  Facebook OAuth routes not configured - missing credentials")

    // Fallback routes when Facebook OAuth is not configured
    app.get("/auth/facebook", (req, res) => {
      console.log("Facebook OAuth not configured, redirecting with error")
      res.redirect("/account.html?error=facebook_not_configured")
    })

    app.get("/auth/facebook/callback", (req, res) => {
      res.redirect("/account.html?error=facebook_not_configured")
    })
  }

  // Simple logout route
  app.post("/auth/logout", (req, res) => {
    res.json({
      message: "Logged out successfully",
      note: "Please clear your local storage on the client side",
    })
  })

  // Check OAuth status
  app.get("/auth/status", (req, res) => {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.json({ authenticated: false })
    }

    try {
      const token = authHeader.substring(7)
      const decoded = jwt.verify(token, process.env.JWT_SECRET)

      res.json({
        authenticated: true,
        user: {
          id: decoded.id,
          email: decoded.email,
        },
      })
    } catch (error) {
      res.json({ authenticated: false })
    }
  })

  console.log("=== OAuth routes setup complete ===")
}
