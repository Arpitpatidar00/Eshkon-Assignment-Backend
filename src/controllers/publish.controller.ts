import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../middlewares/error.middleware';
import { validatePage } from '../domain/schemas';
import type { Page } from '../domain/types';
import { diffPages } from '../domain/publish/diff';
import { calculateNextVersion } from '../domain/publish/semver';
import { hashPageDeep } from '../domain/publish/hash';
import { generateChangelog } from '../domain/publish/changelog';
import { createSnapshot, saveSnapshot, getLatestRelease, getAllReleases } from '../services/snapshot.service';
import PageModel from '../models/Page';

export const previewPublish = catchAsync(async (req: Request, res: Response) => {
  const { slug } = req.query;
  if (!slug || typeof slug !== 'string') {
    throw new AppError('slug parameter required', 400);
  }

  const latestRelease = await getLatestRelease(slug);
  const publishedPage = latestRelease?.page ?? null;
  const currentVersion = latestRelease?.version ?? null;

  const draftDoc = await PageModel.findOne({ slug }).lean();
  if (!draftDoc) {
    throw new AppError('Draft page not found', 404);
  }

  const draftPage = {
    pageId: draftDoc.pageId,
    slug: draftDoc.slug,
    title: draftDoc.title,
    sections: draftDoc.sections,
  };

  const diff = diffPages(publishedPage, draftPage);
  const { version: newVersion, bump } = calculateNextVersion(currentVersion ?? "0.0.0", diff);
  const changelog = generateChangelog(newVersion, diff);

  res.json({
    currentVersion,
    newVersion,
    bump,
    diff,
    changelog,
  });
});

export const publishPage = catchAsync(async (req: Request, res: Response) => {
  const { page } = req.body;
  const userId = (req as any).user?.userId || 'unknown';
  
  const validation = validatePage(page);
  if (!validation.success || !validation.data) {
    throw new AppError('Invalid page data provided', 400);
  }

  const draftPage = validation.data as Page;
  const slug = draftPage.slug;

  const latestRelease = await getLatestRelease(slug);
  const publishedPage = latestRelease?.page ?? null;
  const currentVersion = latestRelease?.version ?? "0.0.0";

  if (publishedPage) {
    const draftHash = hashPageDeep(draftPage);
    const publishedHash = latestRelease!.hash;

    if (draftHash === publishedHash) {
      return res.json({
        message: 'No changes detected. Publish skipped.',
        version: currentVersion,
        skipped: true,
      });
    }
  }

  const diff = diffPages(publishedPage, draftPage);
  const { version: newVersion, bump } = calculateNextVersion(currentVersion, diff);

  if (bump === 'none') {
    return res.json({
      message: 'No changes detected. Publish skipped.',
      version: currentVersion,
      skipped: true,
    });
  }

  const changelog = generateChangelog(newVersion, diff);
  const hash = hashPageDeep(draftPage);
  const snapshot = createSnapshot(newVersion, hash, changelog, draftPage, userId);

  await saveSnapshot(slug, snapshot);

  // Sync draft to match published state
  await PageModel.findOneAndUpdate(
    { slug },
    { $set: draftPage },
    { upsert: true }
  );

  res.json({
    version: newVersion,
    bump,
    changelog,
    publishedAt: snapshot.publishedAt,
    publishedBy: userId,
    message: `Successfully published v${newVersion}`,
  });
});

export const getReleases = catchAsync(async (req: Request, res: Response) => {
  const { slug } = req.query;
  if (!slug || typeof slug !== 'string') {
    throw new AppError('slug parameter required', 400);
  }
  const releases = await getAllReleases(slug);
  res.json({ releases });
});
