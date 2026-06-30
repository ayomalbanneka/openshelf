const passport = require('passport')
const { Strategy: GoogleStrategy } = require('passport-google-oauth20')
const { Strategy: GitHubStrategy } = require('passport-github2')
const oauthService = require('../services/oauth.service')

const API_URL = process.env.API_URL || 'http://localhost:4000'

passport.use(
  'google',
  new GoogleStrategy(
    {
      clientID:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:  `${API_URL}/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await oauthService.findOrCreateUser({
          provider: 'GOOGLE',
          providerId: profile.id,
          email: profile.emails?.[0]?.value,
          name: profile.displayName,
          avatarUrl: profile.photos?.[0]?.value,
        })
        done(null, user)
      } catch (err) {
        done(err, null)
      }
    }
  )
)

passport.use(
  'github',
  new GitHubStrategy(
    {
      clientID:     process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL:  `${API_URL}/api/auth/github/callback`,
      scope:        ['user:email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // GitHub doesn't always return email on the profile — fall back to the emails array
        const email = profile.emails?.[0]?.value || profile._json?.email

        const user = await oauthService.findOrCreateUser({
          provider: 'GITHUB',
          providerId: profile.id,
          email,
          name: profile.displayName || profile.username,
          avatarUrl: profile.photos?.[0]?.value,
        })
        done(null, user)
      } catch (err) {
        done(err, null)
      }
    }
  )
)

module.exports = passport