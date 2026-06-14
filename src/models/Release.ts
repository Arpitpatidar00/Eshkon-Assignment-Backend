import mongoose, { Schema, Document } from 'mongoose';

export interface IRelease extends Document {
  slug: string;
  version: string;
  publishedAt: Date;
  publishedBy: string; // userId of the publisher
  hash: string;
  changelog: string;
  page: any; // Full page snapshot at time of publish
}

const ReleaseSchema: Schema = new Schema({
  slug: { type: String, required: true, index: true },
  version: { type: String, required: true },
  publishedAt: { type: Date, required: true, default: Date.now },
  publishedBy: { type: String, required: true },
  hash: { type: String, required: true },
  changelog: { type: String, required: true },
  page: { type: Schema.Types.Mixed, required: true },
}, {
  timestamps: true,
});

// Compound unique index for slug + version
ReleaseSchema.index({ slug: 1, version: 1 }, { unique: true });

export default mongoose.models.Release || mongoose.model<IRelease>('Release', ReleaseSchema);
