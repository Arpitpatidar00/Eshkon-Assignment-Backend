import ReleaseModel from '../models/Release';
import type { ReleaseSnapshot } from '../domain';

export const createSnapshot = (
  version: string,
  hash: string,
  changelog: string,
  page: any,
  publishedBy: string
): ReleaseSnapshot => {
  return {
    version,
    publishedAt: new Date().toISOString(),
    publishedBy,
    hash,
    changelog,
    page,
  };
};

export const saveSnapshot = async (slug: string, snapshot: ReleaseSnapshot): Promise<void> => {
  await ReleaseModel.create({
    slug,
    version: snapshot.version,
    publishedAt: snapshot.publishedAt,
    publishedBy: snapshot.publishedBy,
    hash: snapshot.hash,
    changelog: snapshot.changelog,
    page: snapshot.page,
  });
};

export const getLatestRelease = async (slug: string): Promise<ReleaseSnapshot | null> => {
  const doc = await ReleaseModel.findOne({ slug })
    .sort({ publishedAt: -1 })
    .lean();
    
  if (!doc) return null;
  
  return {
    version: doc.version,
    publishedAt: doc.publishedAt.toISOString(),
    publishedBy: doc.publishedBy,
    hash: doc.hash,
    changelog: doc.changelog,
    page: doc.page,
  };
};

export const getAllReleases = async (slug: string): Promise<ReleaseSnapshot[]> => {
  const docs = await ReleaseModel.find({ slug })
    .sort({ publishedAt: -1 })
    .lean();
    
  return docs.map(doc => ({
    version: doc.version,
    publishedAt: doc.publishedAt.toISOString(),
    publishedBy: doc.publishedBy,
    hash: doc.hash,
    changelog: doc.changelog,
    page: doc.page,
  }));
};

export const getReleaseByVersion = async (
  slug: string,
  version: string
): Promise<ReleaseSnapshot | null> => {
  const doc = await ReleaseModel.findOne({ slug, version }).lean();
  
  if (!doc) return null;
  
  return {
    version: doc.version,
    publishedAt: doc.publishedAt.toISOString(),
    publishedBy: doc.publishedBy,
    hash: doc.hash,
    changelog: doc.changelog,
    page: doc.page,
  };
};
