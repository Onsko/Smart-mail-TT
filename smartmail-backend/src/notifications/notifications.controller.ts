import { Controller, Get, Patch, Param, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  async findAll(@Req() req: Request) {
    const user = req.user as { _id: { toString: () => string } };
    return this.notificationsService.findByUser(user._id.toString());
  }

  @Get('unread-count')
  async unreadCount(@Req() req: Request) {
    const user = req.user as { _id: { toString: () => string } };
    const count = await this.notificationsService.getUnreadCount(user._id.toString());
    return { count };
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string) {
    await this.notificationsService.markAsRead(id);
    return { success: true };
  }

  @Patch('mark-all-read')
  async markAllRead(@Req() req: Request) {
    const user = req.user as { _id: { toString: () => string } };
    await this.notificationsService.markAllRead(user._id.toString());
    return { success: true };
  }
}
