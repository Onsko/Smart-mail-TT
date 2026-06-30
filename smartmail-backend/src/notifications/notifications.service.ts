import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
  ) {}

  async createForUser(userId: string, message: string, type: string, courrierId?: string): Promise<NotificationDocument> {
    return this.notificationModel.create({
      user: new Types.ObjectId(userId),
      message,
      type,
      courrier: courrierId ? new Types.ObjectId(courrierId) : undefined,
    });
  }

  // Create a notification for all users with a given role (e.g. all CHEF users of a service).
  async createForUsers(userIds: string[], message: string, type: string, courrierId?: string): Promise<void> {
    if (userIds.length === 0) return;
    const docs = userIds.map((uid) => ({
      user: new Types.ObjectId(uid),
      message,
      type,
      courrier: courrierId ? new Types.ObjectId(courrierId) : null,
    }));
    await this.notificationModel.insertMany(docs);
  }

  async findByUser(userId: string): Promise<NotificationDocument[]> {
    return this.notificationModel
      .find({ user: new Types.ObjectId(userId) })
      .populate('courrier', 'reference objet')
      .sort({ createdAt: -1 })
      .limit(30)
      .exec();
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationModel.countDocuments({
      user: new Types.ObjectId(userId),
      read: false,
    }).exec();
  }

  async markAsRead(notificationId: string): Promise<void> {
    await this.notificationModel.findByIdAndUpdate(notificationId, { read: true }).exec();
  }

  async markAllRead(userId: string): Promise<void> {
    await this.notificationModel.updateMany(
      { user: new Types.ObjectId(userId), read: false },
      { $set: { read: true } },
    ).exec();
  }
}
