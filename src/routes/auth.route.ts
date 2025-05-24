import express, { Request, Response, NextFunction } from 'express'
import { body, validationResult } from 'express-validator'
import jwt from 'jsonwebtoken'
import passport from 'passport'
import { ensureLoggedIn, ensureLoggedOut } from 'connect-ensure-login'
// import { sendMail } from '../utils/mailer'
import bcrypt from 'bcrypt'
import { getGravatarUrl } from '@/utils/functions/gravatar'
import { User } from '@/models/user.model'

interface AuthResponse {
  success: 0 | 1
  message: { [key: string]: string[] }
  user?: any
  token?: string
}

const router = express.Router()

/**
 * ----------------------------------------------------
 * --------- Router: Signin---------
 * ----------------------------------------------------
 */
router.post('/login', (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate(
    'local',
    {
      session: false,
    },
    (err: Error, user: any, info: { message: string }) => {
      if (err || !user) {
        return res.status(401).json({
          success: 0,
          message: { error: [info.message] },
          user,
        } as AuthResponse)
      }

      req.login(user, { session: false }, (err) => {
        if (err) {
          return res.status(500).json({
            success: 0,
            message: { error: [info.message] },
            user,
          } as AuthResponse)
        }

        const token = jwt.sign({ user }, process.env.AUTH_KEY!, {
          expiresIn: '5h',
        })
        return res.status(200).json({
          success: 1,
          message: { success: ['User logged in successfully'] },
          user,
          token,
        } as AuthResponse)
      })
    }
  )(req: Request, res: Response, next: NextFunction)
})

/**
 * ----------------------------------------------------
 * --------- Router: Signup---------
 * ----------------------------------------------------
 */
interface RegisterBody {
  username: string
  email: string
  password: string
}

router.post(
  '/register',
  ensureLoggedOut({ redirectTo: '/' }),
  [
    body('username').isString().not().isEmpty().withMessage('Name is required'),
    body('email')
      .isString()
      .trim()
      .isEmail()
      .withMessage('Email must be a valid email')
      .custom((value) => {
        if (value.endsWith('@byolacademy.com')) {
          throw new Error('Only team members can register with this domain')
        }
        return true
      })
      .normalizeEmail()
      .toLowerCase(),
    body('password').isString().trim().isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('password').matches(/\d/).withMessage('Password must contain at least one number'),
    body('password')
      .matches(/[!@#$%^&*(),.?":{}|<>+]/)
      .withMessage('Password must contain at least one special character'),
  ],
  async (req: Request<{}, {}, RegisterBody>, res: Response<AuthResponse>, next: NextFunction) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        errors.array().forEach((error) => {})
        return res.status(400).json({
          success: 0,
          message: { error: [error.msg] },
        })
      }
      const { email } = req.body
      const doesExists = await User.findOne({ email })
      if (doesExists) {
        return res.status(400).json({
          success: 0,
          message: { error: ['Email already exists'] },
        })
      }
      const obj = { ...req.body, profileImageURL: getGravatarUrl() }
      const user = new User(obj)
      await user.save()

      // await sendMail({ email, emailType: 'VERIFY', userId: user._id })
      return res.status(200).json({
        success: 1,
        message: { success: [`${user.email} registered successfully, you can now sign in`] },
      })
    } catch (error) {
      next(error)
    }
  }
)

/**
 * ----------------------------------------------------
 * --------- Router: Signin using Google--------
 * ----------------------------------------------------
 */
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
)
// Retrieve user data using the access token received from Google
router.get(
  '/google/callback',
  passport.authenticate('google', {
    successRedirect: `${process.env.VITE_CLIENT_URL}/dashboard`,
    failureRedirect: `${process.env.VITE_CLIENT_URL}/404`,
    failureFlash: true,
  })
)
// route for google success
router.get('/google/success', (req: Request, res: Response, next: NextFunction) => {
  if (req.user.status === 'inactive') {
    return res.status(401).json({
      success: 0,
      message: { error: ['Only invited users are allowed to log in.'] },
    })
  }
  const token = jwt.sign({ user: req.user }, process.env.AUTH_KEY, {
    expiresIn: '5h',
  })
  return res.status(200).json({
    success: 1,
    message: { error: ['User logged in successfully'] },
    user: req.user,
    token,
  })
  next()
})

/**
 * ----------------------------------------------------
 * --------- Router: Logout---------
 * ----------------------------------------------------
 */
router.post('/logout', (req: Request, res: Response, next: NextFunction) => {
  req.logout(() => {
    req.session.destroy((err) => {
      if (err) {
        return next(err)
      }
      return res.status(200).send({ message: 'Logged out successfully' })
    })
  })
})

/**
 * ----------------------------------------------------
 * --------- Router: Forgot Password---------
 * ----------------------------------------------------
 */
router.post(
  '/forgot-password',
  ensureLoggedOut({ redirectTo: '/' }),
  [body('email').trim().isEmail().withMessage('Email must be a valid email').normalizeEmail().toLowerCase()],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req)
   if (!errors.isEmpty()) {
  const errorMessages = errors.array().map(error => error.msg);
  return res.status(400).json({
    success: 0,
    message: { error: errorMessages },
  });
}
      const { email } = req.body
      const wait = 10 * 60 * 1000 // 10 minutes in milliseconds
      const user = await User.findOne({ email })
      if (user) {
        // Check if the expiry time is set and is still within the 10-minute window
        if (user.forgotPasswordTokenExpiryInterval && Date.now() < user.forgotPasswordTokenExpiryInterval.getTime() + wait) {
          return res.status(400).json({
            success: 0,
            message: { success: ['You can request a new password reset link after 10 minutes from your last request.'] },
          })
        }
        // Send the password reset email
        // await sendMail({ email, emailType: 'RESET', userId: user._id })
        return res.status(200).json({
          success: 1,
          message: { success: [`Password reset link has been sent to ${email}.`] },
        })
      }
      return res.status(400).json({
        success: 0,
        message:{error: ['Email does not exist']},
      })
    } catch (error) {
      next(error)
    }
  }
)

router.post(
  '/forgot-password-change',
  ensureLoggedOut({ redirectTo: '/' }),
  [
    body('token').isString().not().isEmpty().withMessage('Token required'),
    body('password').isString().trim().isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('password').matches(/\d/).withMessage('Password must contain at least one number'),
    body('password')
      .matches(/[!@#$%^&*(),.?":{}|<>+]/)
      .withMessage('Password must contain at least one special character'),
    body('confirmPassword')
      .isString()
      .custom((value, { req }) => {
        if (value !== req.body.password) {
          throw new Error('Passwords do not match')
        }
        return true
      }),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req)
  if (!errors.isEmpty()) {
  const errorMessages = errors.array().map(error => error.msg);
  return res.status(400).json({
    success: 0,
    message: { error: errorMessages },
  });
}
      const { token, password } = req.body
      const tokenExists = await User.findOne({
        forgotPasswordToken: token,
        forgotPasswordTokenExpiry: { $gt: Date.now() },
      })
      //check if token exists
      if (!tokenExists) {
        return res.status(400).json({
          success: 0,
          message: { error: ['Invalid/Expired token'] },
        })
      }
      //check if token is expired
      if (tokenExists.forgotPasswordTokenExpiry && Date.now() > tokenExists.forgotPasswordTokenExpiry.getTime()) {
        return res.status(400).json({
          success: 0,
          message: { error: ['Link Expired'] },
        })
      }
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash(password, salt)
      tokenExists.password = hashedPassword
      tokenExists.forgotPasswordToken = null
      tokenExists.forgotPasswordTokenExpiry = null
      await tokenExists.save()

      return res.status(200).json({
        success: 1,
        message: { success: [`Password changed sucessfully`] },
      })
    } catch (error) {
      next(error)
    }
  }
)
/**
 * ----------------------------------------------------
 * --------- Router: Email Verification---------
 * ----------------------------------------------------
 */
router.post('/verify-email', ensureLoggedOut({ redirectTo: '/' }), [body('token').not().isEmpty().withMessage('Token required')], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req)
 if (!errors.isEmpty()) {
  const errorMessages = errors.array().map(error => error.msg);
  return res.status(400).json({
    success: 0,
    message: { error: errorMessages },
  });
}
    const { token } = req.body
    const tokenExists = await User.findOne({
      verifyToken: token,
      verifyTokenExpiry: { $gt: Date.now() },
    })
    if (!tokenExists) {
      return res.status(400).json({
        success: 0,
        message: { error: ['Invalid Token'] },
      })
    }
    tokenExists.verifyToken = null
    tokenExists.verifyTokenExpiry = null
    await tokenExists.save()

    return res.status(200).json({
      success: 1,
      message: { success: [`Email verified sucessfully`] },
    })
  } catch (error) {
    return next(error)
  }
})

/**
 * ----------------------------------------------------
 * --------- Router: Members Invite---------
 * ----------------------------------------------------
 */
router.post(
  '/invite',
  ensureLoggedOut({ redirectTo: '/' }),
  [
    body('email')
      .trim()
      .isEmail()
      .withMessage(`Member's email must be a valid email`)
      .custom((value) => {
        if (value.endsWith('@byolacademy.com')) {
          throw new Error('We are not Interested. For Now :)')
        }
        return true
      })
      .normalizeEmail()
      .toLowerCase(),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        const errorMessages = errors.array().map((error) => error.msg)
        return res.status(400).json({
          success: 0,
          message: { error: errorMessages },
        })
      }
      const { email } = req.body
      // Send the password reset email
      // await sendMail({ email, emailType: 'INVITE', userId: user._id })
      return res.status(200).json({
        success: 1,
        message: { success: [`Invitation send`] },
      })
    } catch (error) {
      next(error)
    }
  }
)

export default router
