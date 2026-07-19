import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash?: string;
  googleId?: string;
  role: 'customer' | 'provider' | 'admin';
  avatarUrl?: string;
  bio?: string;
  location?: string;
  phone?: string;
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String },
    googleId: { type: String, sparse: true, unique: true },
    role: { type: String, enum: ['customer', 'provider', 'admin'], default: 'customer' },
    avatarUrl: { type: String },
    bio: { type: String },
    location: { type: String },
    phone: { type: String },
    refreshToken: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', UserSchema);
