import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { validate } from '../../middleware/validate.js';
import { uploadLimiter } from '../../middleware/rateLimiter.js';
import { avatarUpload } from '../../middleware/upload.js';
import { createUploadPipeline } from '../../middleware/uploadPipeline.js';
import { updateMeSchema } from './user.schema.js';
import { uploadAvatar, deleteAvatar, getMe, updateMe } from './avatar.controller.js';

export const userRouter = Router();
userRouter.use(requireAuth);

userRouter.post(
  '/avatar',
  uploadLimiter,
  ...createUploadPipeline({ multerInstance: avatarUpload, fieldName: 'avatar', category: 'avatars', processImages: true, generateThumbs: false }),
  uploadAvatar,
);

userRouter.delete('/avatar', deleteAvatar);
userRouter.get('/me',        getMe);
userRouter.patch('/me',      validate({ body: updateMeSchema }), updateMe);
