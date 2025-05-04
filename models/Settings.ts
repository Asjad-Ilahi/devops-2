import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
  siteName: string;
  supportEmail: string;
  supportPhone: string;
  instagramUrl?: string;
  twitterUrl?: string;
  facebookUrl?: string;
  privacyPolicy: string;
  termsOfService: string;
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
  logoWidth?: number;
  logoHeight?: number;
  zelleLogoUrl?: string;
  zelleLogoWidth?: number;
  zelleLogoHeight?: number;
  checkingIcon?: string;
  savingsIcon?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema: Schema = new Schema({
  siteName: { type: String, required: true },
  supportEmail: { type: String, required: true },
  supportPhone: { type: String, required: true },
  instagramUrl: { type: String, required: false },
  twitterUrl: { type: String, required: false },
  facebookUrl: { type: String, required: false },
  privacyPolicy: { type: String, required: true },
  termsOfService: { type: String, required: true },
  primaryColor: { type: String, required: false },
  secondaryColor: { type: String, required: false },
  logoUrl: { type: String, required: false },
  logoWidth: { type: Number, required: false },
  logoHeight: { type: Number, required: false },
  zelleLogoUrl: { type: String, required: false },
  zelleLogoWidth: { type: Number, required: false },
  zelleLogoHeight: { type: Number, required: false },
  checkingIcon: { type: String, required: false },
  savingsIcon: { type: String, required: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update updatedAt on save
SettingsSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema);
