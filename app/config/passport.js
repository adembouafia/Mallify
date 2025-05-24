const passport = require("passport")
const GoogleStrategy = require("passport-google-oauth20").Strategy
const FacebookStrategy = require("passport-facebook").Strategy
const Client = require("../models/client.model")

console.log("=== Passport Configuration Starting ===")

// Check if required environment variables are set
const requiredEnvVars = {
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID,
  FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET,
  JWT_SECRET: process.env.JWT_SECRET,
}

console.log("Environment variables check:")
for (const [key, value] of Object.entries(requiredEnvVars)) {
  console.log(`${key}:`, value ? "✅ SET" : "❌ NOT SET")
}

// Configure Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  console.log("🔧 Configuring Google OAuth Strategy...")

  try {
    passport.use(
      "google",
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: "/auth/google/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            console.log("Google OAuth callback triggered for user:", profile.id)

            // Check if user already exists with this Google ID or email
            const existingUser = await Client.findOne({
              $or: [
                { googleId: profile.id },
                { email: profile.emails && profile.emails[0] ? profile.emails[0].value : null },
              ],
            })

            if (existingUser) {
              console.log("Existing user found:", existingUser._id)
              // Update Google ID if user exists but doesn't have it
              if (!existingUser.googleId) {
                existingUser.googleId = profile.id
                existingUser.profilePicture =
                  profile.photos && profile.photos[0] ? profile.photos[0].value : existingUser.profilePicture
                await existingUser.save()
                console.log("Updated existing user with Google ID")
              }
              return done(null, existingUser)
            }

            // Create new user
            console.log("Creating new user from Google profile")
            const newUser = new Client({
              googleId: profile.id,
              firstname: profile.name && profile.name.givenName ? profile.name.givenName : "",
              lastname: profile.name && profile.name.familyName ? profile.name.familyName : "",
              email: profile.emails && profile.emails[0] ? profile.emails[0].value : "",
              profilePicture: profile.photos && profile.photos[0] ? profile.photos[0].value : "",
              // Generate a random password for OAuth users
              password: Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8),
              authProvider: "google",
              isEmailVerified: true, // Google emails are pre-verified
            })

            const savedUser = await newUser.save()
            console.log("New Google user created:", savedUser._id)

            return done(null, savedUser)
          } catch (error) {
            console.error("Google OAuth Error:", error)
            return done(error, null)
          }
        },
      ),
    )
    console.log("✅ Google OAuth Strategy configured successfully")
  } catch (error) {
    console.error("❌ Error configuring Google OAuth Strategy:", error)
  }
} else {
  console.log("⚠️  Google OAuth Strategy not configured - missing credentials")
}

// Configure Facebook OAuth Strategy
if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  console.log("🔧 Configuring Facebook OAuth Strategy...")

  try {
    passport.use(
      "facebook",
      new FacebookStrategy(
        {
          clientID: process.env.FACEBOOK_APP_ID,
          clientSecret: process.env.FACEBOOK_APP_SECRET,
          callbackURL: "/auth/facebook/callback",
          profileFields: ["id", "displayName", "name", "emails", "photos"],
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            console.log("Facebook OAuth callback triggered for user:", profile.id)

            // Check if user already exists with this Facebook ID or email
            const existingUser = await Client.findOne({
              $or: [
                { facebookId: profile.id },
                { email: profile.emails && profile.emails[0] ? profile.emails[0].value : null },
              ],
            })

            if (existingUser) {
              console.log("Existing user found:", existingUser._id)
              // Update Facebook ID if user exists but doesn't have it
              if (!existingUser.facebookId) {
                existingUser.facebookId = profile.id
                existingUser.profilePicture =
                  profile.photos && profile.photos[0] ? profile.photos[0].value : existingUser.profilePicture
                await existingUser.save()
                console.log("Updated existing user with Facebook ID")
              }
              return done(null, existingUser)
            }

            // Create new user
            console.log("Creating new user from Facebook profile")
            const newUser = new Client({
              facebookId: profile.id,
              firstname:
                profile.name && profile.name.givenName
                  ? profile.name.givenName
                  : profile.displayName
                    ? profile.displayName.split(" ")[0]
                    : "",
              lastname:
                profile.name && profile.name.familyName
                  ? profile.name.familyName
                  : profile.displayName
                    ? profile.displayName.split(" ").slice(1).join(" ")
                    : "",
              email: profile.emails && profile.emails[0] ? profile.emails[0].value : "",
              profilePicture: profile.photos && profile.photos[0] ? profile.photos[0].value : "",
              // Generate a random password for OAuth users
              password: Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8),
              authProvider: "facebook",
              isEmailVerified: true, // Facebook emails are pre-verified
            })

            const savedUser = await newUser.save()
            console.log("New Facebook user created:", savedUser._id)

            return done(null, savedUser)
          } catch (error) {
            console.error("Facebook OAuth Error:", error)
            return done(error, null)
          }
        },
      ),
    )
    console.log("✅ Facebook OAuth Strategy configured successfully")
  } catch (error) {
    console.error("❌ Error configuring Facebook OAuth Strategy:", error)
  }
} else {
  console.log("⚠️  Facebook OAuth Strategy not configured - missing credentials")
}

console.log("=== Passport Configuration Complete ===")

module.exports = passport
