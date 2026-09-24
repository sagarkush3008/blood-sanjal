import { Notification, NotificationType } from './notification.model';
import { User } from '../users/user.model';
import { DonorProfile } from '../donors/donorProfile.model';
import { AppError } from '../../core/errors/appError';
import { logger } from '../../config/logger.config';

interface DispatchOptions {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  dedupeKey: string;
  entityId?: string;
  expiresAt?: Date;
  forceEmail?: boolean;
}

export class NotificationService {
  static async dispatch(opts: DispatchOptions) {
    try {
      const user = await User.findById(opts.userId);
      if (!user) return;
      
      const donor = await DonorProfile.findOne({ userId: opts.userId });
      
      let prefersInApp = true;
      let prefersEmail = false;

      if (donor) {
        if (donor.notificationPreference === 'NONE') return;
        if (donor.notificationPreference === 'EMERGENCY_ONLY' && opts.type !== 'EMERGENCY') {
           return;
        }
        if (donor.contactPreference === 'EMAIL' || opts.forceEmail) {
           prefersEmail = true;
        }
      } else {
        prefersEmail = true; 
      }

      let notification = await Notification.findOne({ dedupeKey: opts.dedupeKey });
      if (!notification) {
         notification = await Notification.create({
           userId: opts.userId,
           type: opts.type,
           title: opts.title,
           message: opts.message,
           dedupeKey: opts.dedupeKey,
           entityId: opts.entityId,
           expiresAt: opts.expiresAt,
           emailStatus: prefersEmail ? 'PENDING' : undefined
         });
      }

      if (prefersEmail && notification.emailStatus !== 'SENT') {
         this.sendEmail(notification._id as string, user.email, opts.title, opts.message).catch(e => {
            logger.error(`Background email dispatch failed for ${notification?._id}`, e);
         });
      }

      return notification;
    } catch (error) {
      logger.error('Failed to dispatch notification', error);
    }
  }

  static async sendEmail(notificationId: string, email: string | undefined, title: string, message: string) {
    const notif = await Notification.findById(notificationId);
    if (!notif) return;
    
    if (!email) {
      notif.emailStatus = 'FAILED';
      notif.emailProviderRef = 'No email address';
      await notif.save();
      return;
    }

    try {
      if (title.includes('FAIL_EMAIL')) {
         throw new Error('Provider timeout');
      }

      logger.info(`[MAIL_MOCK] Sending email to ${email}: [${title}] ${message}`);
      
      notif.emailStatus = 'SENT';
      notif.emailDispatched = true;
      notif.emailProviderRef = `mock_ref_${Date.now()}`;
      await notif.save();
    } catch (error: any) {
      notif.emailStatus = 'FAILED';
      notif.emailProviderRef = error.message;
      await notif.save();
      throw error;
    }
  }

  static async listUserNotifications(userId: string, filters: any) {
     const query: any = { userId };
     if (filters.unreadOnly === 'true') {
        query.isRead = false;
     }
     
     const limit = parseInt(filters.limit) || 20;
     const page = parseInt(filters.page) || 1;
     const skip = (page - 1) * limit;

     const notifications = await Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit);
     return notifications;
  }

  static async getUnreadCount(userId: string) {
     const count = await Notification.countDocuments({ userId, isRead: false });
     return count;
  }

  static async markAsRead(notificationId: string, userId: string) {
     const notif = await Notification.findOneAndUpdate(
       { _id: notificationId, userId },
       { isRead: true, readAt: new Date() },
       { new: true }
     );
     if (!notif) throw new AppError(404, 'NOT_FOUND', 'Notification not found');
     return notif;
  }

  static async markAllAsRead(userId: string) {
     const result = await Notification.updateMany(
       { userId, isRead: false },
       { isRead: true, readAt: new Date() }
     );
     return result.modifiedCount;
  }
}
