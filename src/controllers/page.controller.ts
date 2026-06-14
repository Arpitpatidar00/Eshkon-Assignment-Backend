import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../middlewares/error.middleware';
import PageModel from '../models/Page';
import { validatePage } from '../domain/schemas';

export const getPageDraft = catchAsync(async (req: Request, res: Response) => {
  const { slug } = req.params;
  let pageDoc = await PageModel.findOne({ slug }).lean();

  if (!pageDoc) {
    if (slug === 'home') {
      // Auto-create default home page if it doesn't exist
      const { v4: uuidv4 } = require('uuid');
      const newPage = await PageModel.create({
        pageId: `page_${uuidv4()}`,
        slug: 'home',
        title: 'Home Page',
        sections: [
          {
            id: `hero-${uuidv4().slice(0, 8)}`,
            type: 'hero',
            props: {
              title: 'Welcome to Page Studio',
              subtitle: 'Start building your landing page today.',
              ctaLabel: 'Get Started',
              ctaUrl: '#',
            },
          },
        ],
      });
      pageDoc = newPage.toObject();
    } else {
      throw new AppError('Page not found', 404);
    }
  }

  const page = {
    pageId: pageDoc.pageId,
    slug: pageDoc.slug,
    title: pageDoc.title,
    sections: pageDoc.sections,
  };

  const validation = validatePage(page);
  if (!validation.success) {
    // If validation fails on DB data, it's a 500 level corruption error
    throw new AppError('Invalid page structure in database', 500);
  }

  res.json({ page: validation.data });
});

export const getAllPageSlugs = catchAsync(async (req: Request, res: Response) => {
  const pages = await PageModel.find().lean();
  res.json({ pages: pages.map((p) => ({ slug: p.slug, title: p.title })) });
});

export const updatePageDraft = catchAsync(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const { page } = req.body;

  const validation = validatePage(page);
  if (!validation.success || !validation.data) {
    throw new AppError('Invalid page data provided', 400);
  }

  const updatedPage = await PageModel.findOneAndUpdate(
    { slug },
    { $set: validation.data },
    { new: true, upsert: true }
  ).lean();

  res.json({
    message: 'Draft saved successfully',
    page: {
      pageId: updatedPage.pageId,
      slug: updatedPage.slug,
      title: updatedPage.title,
      sections: updatedPage.sections,
    }
  });
});
