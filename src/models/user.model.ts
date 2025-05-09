import mongoose, { Document, Model, Schema } from 'mongoose'
import bcrypt from 'bcrypt'
import { ByolRole, plans } from '@/types/constants'

export interface UserDocument extends Document {
  username: string
  email: string
  password: string
  role: string
  currentPlan: string
  status: string
  firstName?: string
  lastName?: string
  profileImageURL?: string
  provider: string
  company?: string
  providerData?: object
  isVerified: boolean
  forgotPasswordToken?: string
  forgotPasswordTokenExpiry?: Date
  forgotPasswordTokenExpiryInterval?: Date
  verifyToken?: string
  verifyTokenExpiry?: Date
  inviteToken?: string
  inviteTokenExpiry?: Date
  inviteTokenExpiryInterval?: Date
  isvalidPassword: (password: string) => Promise<boolean>
}

// Define the user schema
const UserSchema: Schema<UserDocument> = new mongoose.Schema(
  {
    username: {
      type: String,
      trim: true,
      required: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    password: {
      type: String,
      trim: true,
      required: true,
    },
    role: {
      type: String,
      trim: true,
      enum: [ByolRole.Admin, ByolRole.Member],
      default: ByolRole.Admin,
    },
    currentPlan: {
      type: String,
      trim: true,
      enum: ['Basic', 'Premium'],
      default: 'Basic',
    },
    status: {
      type: String,
      trim: true,
      enum: ['active', 'inactive'],
      default: 'inactive',
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    profileImageURL: {
      type: String,
      trim: true,
    },
    provider: {
      type: String,
      trim: true,
      enum: ['google', 'email'],
      default: 'email',
    },
    company: {
      type: String,
      trim: true,
    },
    providerData: {
      type: Object,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    forgotPasswordToken: String,
    forgotPasswordTokenExpiry: Date,
    forgotPasswordTokenExpiryInterval: Date,
    verifyToken: String,
    verifyTokenExpiry: Date,
    inviteToken: String,
    inviteTokenExpiry: Date,
    inviteTokenExpiryInterval: Date,
  },
  { timestamps: true }
)

// Pre-save hook to hash the password
UserSchema.pre<UserDocument>('save', async function (next) {
  try {
    if (this.isNew) {
      // isNew is a property in mongoose which tells if the document is new or not because evertime we hit the user.save() method it will hasshed the password again
      const salt = await bcrypt.genSalt(10)
      const hashedPassword = await bcrypt.hash(this.password, salt)
      this.password = hashedPassword

      if (this.email === process.env.ADMIN_EMAIL?.toLowerCase()) {
        this.role = ByolRole.Admin
        this.status = 'active'
      }
    }
    next()
  } catch (err) {
    next(err as Error)
  }
})

// Method to compare passwords
UserSchema.methods.isvalidPassword = async function (this: UserDocument, password: string): Promise<boolean> {
  try {
    const hashedPassword = this.password.replace('$2y$', '$2b$')
    return await bcrypt.compare(password, hashedPassword)
  } catch (error) {
    throw new Error((error as Error).message)
  }
}

// Check if the model is already compiled
const User: Model<UserDocument> = mongoose.models.byol_user || mongoose.model<UserDocument>('byol_user', UserSchema)

export { User }
