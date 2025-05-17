import dotenv from 'dotenv'
dotenv.config()
import passport from 'passport'
import { Strategy as LocalStrategy } from 'passport-local'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { User } from '../models/user.model.js'
import { Strategy as GithubStrategy } from 'passport-github2'
import passportJWT from 'passport-jwt'
import { getGravatarUrl } from './gravatar.js'

const JWTStrategy = passportJWT.Strategy
const ExtractJWT = passportJWT.ExtractJwt

// local OAuth------------------------------------------------------------------------------------
passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        const user = await User.findOne({ email })
        if (!user) {
          return done(null, false, {
            message: 'Username/Email not registered',
          })
        }
        if (user.status === 'inactive') {
          return done(null, false, {
            message: 'Only invited users are allowed to log in.',
          })
        }
        // email exists let's verify the password and assign jwt token
        const isMatch = await user.isvalidPassword(password)
        if (isMatch) {
          return done(null, user)
        }
        return done(null, false, {
          message: 'Email and Password does not match',
        })
      } catch (error) {
        done(error)
      }
    },
  ),
)

// google OAuth------------------------------------------------------------------------------------
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID_GOOGLE,
      clientSecret: process.env.CLIENT_SECRET_GOOGLE,
      callbackURL: '/api/v1/auth/google/callback',
      passReqToCallback: true,
      scope: ['profile', 'email'],
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({
          email: profile.emails[0].value,
        })

        if (user) {
          return done(null, user)
        }

        user = new User({
          username: profile.displayName,
          email: profile.emails[0].value,
          password: profile.id,
          firstName: profile.name.givenName,
          lastName: profile.name.familyName,
          profileImageURL: profile?.photos[0]?.value ? profile.photos[0].value : getGravatarUrl(),
          provider: 'google',
          location: profile._json?.locale,
          providerData: profile,
        })
        await user.save()
        return done(null, user)
      } catch (error) {
        return done(error, false)
      }
    },
  ),
)

// github OAuth------------------------------------------------------------------------------------
passport.use(
  new GithubStrategy(
    {
      clientID: process.env.CLIENT_ID_GITHUB,
      clientSecret: process.env.CLIENT_SECRET_GITHUB,
      callbackURL: '/api/v1/auth/github/callback',
      passReqToCallback: true,
      scope: ['profile', 'email'],
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({
          email: profile.emails[0].value,
        })

        if (user) {
          return done(null, user)
        }
        user = new User({
          username: profile.displayName,
          email: profile.emails[0].value,
          password: profile.id,
          profileImageURL: profile?.photos[0]?.value ? profile.photos[0].value : getGravatarUrl(),
          provider: 'github',
          company: profile._json?.company,
          location: profile._json?.location,
          providerData: profile,
        })
        await user.save()
        return done(null, user)
      } catch (error) {
        return done(error, false)
      }
    },
  ),
)

// Automatic session building cookie for persistent login by passport library
passport.serializeUser((user, done) => {
  done(null, user.id)
})
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id)
    done(null, user)
  } catch (err) {
    done(err)
  }
})

// JWT Authentication middleware using passport and continue to next middleware
passport.use(
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.AUTH_KEY,
    },
    async (jwt_payload, done) => {
      try {
        const user = await User.findById(jwt_payload.user._id)
        if (user && user.provider === jwt_payload.user.provider) {
          return done(null, user)
        }
        return done(null, false)
      } catch (error) {
        done(error)
      }
    },
  ),
)
