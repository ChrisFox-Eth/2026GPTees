import express from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireAdmin } from '../middleware/admin.middleware.js';
import {
  createHashtagSet,
  createSocialPost,
  createTemplate,
  deleteHashtagSet,
  deleteSocialPost,
  deleteTemplate,
  exportSocialCsv,
  bulkUpdateStatus,
  bulkDeletePosts,
  suggestPrompts,
  generateImageForPost,
  generateBatchImagesForPost,
  listDesignAssets,
  listHashtagSets,
  listSocialPosts,
  listTemplates,
  publishPack,
  scheduleSocialPost,
  updateHashtagSet,
  updateSocialPost,
  updateTemplate,
  listPromptBank,
  upsertPromptBank,
  deletePromptBank,
  autoWeekSocialPosts,
  autoSingleSocialPost,
  pollVideoStatus,
  generateFramesOnly,
  stitchFramesFromAssets,
} from '../controllers/social.controller.js';

const router = express.Router();

// Dev-only admin endpoints (require auth + admin guard)
router.use(requireAuth, requireAdmin);

// Social posts
router.get('/posts', listSocialPosts);
router.post('/posts', createSocialPost);
router.patch('/posts/:id', updateSocialPost);
router.delete('/posts/:id', deleteSocialPost);
router.post('/posts/bulk/status', bulkUpdateStatus);
router.post('/posts/bulk/delete', bulkDeletePosts);
router.post('/posts/:id/schedule', scheduleSocialPost);
router.get('/posts/:id/publish-pack', publishPack);
router.post('/posts/:id/prompts', suggestPrompts);
router.post('/posts/:id/generate-image', generateImageForPost);
router.post('/posts/:id/generate-images', generateBatchImagesForPost);
router.post('/posts/:id/poll-video', pollVideoStatus);
router.post('/posts/:id/generate-frames', generateFramesOnly);
router.post('/posts/:id/stitch', stitchFramesFromAssets);
router.get('/assets', listDesignAssets);
router.post('/auto-week', autoWeekSocialPosts);
router.post('/auto-one', autoSingleSocialPost);

// CSV export
router.get('/export.csv', exportSocialCsv);

// Templates
router.get('/templates', listTemplates);
router.post('/templates', createTemplate);
router.patch('/templates/:key', updateTemplate);
router.delete('/templates/:key', deleteTemplate);

// Prompt bank
router.get('/prompt-bank', listPromptBank);
router.post('/prompt-bank', upsertPromptBank);
router.delete('/prompt-bank/:id', deletePromptBank);

// Hashtag sets
router.get('/hashtag-sets', listHashtagSets);
router.post('/hashtag-sets', createHashtagSet);
router.patch('/hashtag-sets/:id', updateHashtagSet);
router.delete('/hashtag-sets/:id', deleteHashtagSet);

export default router;
