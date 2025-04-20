import mongoose, { Schema, Document } from 'mongoose';

export interface ISettings extends Document {
  siteName: string;
  supportEmail: string;
  supportPhone: string;
  instagramUrl?: string;
  twitterUrl?: string;
  facebookUrl?: string;
  linkedinUrl?: string;
  privacyPolicy: string;
  termsOfService: string;
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
  linkedinUrl: { type: String, required: false },
  privacyPolicy: { type: String, required: true },
  termsOfService: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update updatedAt on save
SettingsSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.Settings || mongoose.model<ISettings>('Settings', SettingsSchema);