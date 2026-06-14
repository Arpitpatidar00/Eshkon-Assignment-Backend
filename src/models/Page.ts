import mongoose, { Schema, Document } from 'mongoose';

export interface IPage extends Document {
  pageId: string;
  slug: string;
  title: string;
  sections: any[];
}

const PageSchema: Schema = new Schema({
  pageId: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  sections: { type: [Schema.Types.Mixed], default: [] },
}, {
  timestamps: true, // adds createdAt and updatedAt
});

export default mongoose.models.Page || mongoose.model<IPage>('Page', PageSchema);
