import mongoose from 'mongoose';

const BannerSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  subtitle: { type: String, default: '' },
  position: { type: String, enum: ['HOME_HERO', 'CATEGORY_COVER', 'PROMO_BANNER'], required: true },
  targetServiceType: { type: String, enum: ['all', 'spa', 'nail', 'makeup'], default: 'all' },
  link: { type: String, default: '' },
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  imagePath: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
}, { timestamps: true });

export default mongoose.models.Banner || mongoose.model('Banner', BannerSchema);
