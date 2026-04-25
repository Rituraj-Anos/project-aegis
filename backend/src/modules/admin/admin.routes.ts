import { Router } from 'express';
import { requireAuth } from '../../middleware/requireAuth.js';
import { roleGuard } from '../../middleware/roleGuard.js';
import { validate } from '../../middleware/validate.js';
import { listUsersSchema, updateUserRoleSchema } from './admin.schema.js';
import { listUsers, getUserDetails, updateUserRole, deleteUser, unlockUser, getPlatformStats } from './admin.controller.js';

export const adminRouter = Router();
adminRouter.use(requireAuth, roleGuard('admin'));

adminRouter.get('/users',                 validate({ query: listUsersSchema }), listUsers);
adminRouter.get('/users/stats',           getPlatformStats);
adminRouter.get('/users/:userId',         getUserDetails);
adminRouter.patch('/users/:userId/role',  validate({ body: updateUserRoleSchema }), updateUserRole);
adminRouter.delete('/users/:userId',      deleteUser);
adminRouter.post('/users/:userId/unlock', unlockUser);
