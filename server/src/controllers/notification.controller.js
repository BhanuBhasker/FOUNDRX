import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { parsePagination, buildMeta } from '../utils/pagination.js';
import { listNotifications, markNotificationRead, markAllNotificationsRead } from '../models/notification.model.js';

export const getNotifications = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query, { defaultLimit: 20 });
  const { rows, total, unread } = await listNotifications(req.user.user_id, {
    limit,
    offset,
    unreadOnly: req.query.unreadOnly === 'true',
  });
  sendSuccess(res, {
    message: 'Notifications fetched',
    data: { notifications: rows, unread },
    meta: buildMeta({ page, limit, total }),
  });
});

export const markRead = asyncHandler(async (req, res) => {
  await markNotificationRead(Number(req.params.id), req.user.user_id);
  sendSuccess(res, { message: 'Notification marked as read' });
});

export const markAllRead = asyncHandler(async (req, res) => {
  await markAllNotificationsRead(req.user.user_id);
  sendSuccess(res, { message: 'All notifications marked as read' });
});
