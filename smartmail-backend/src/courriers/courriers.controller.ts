import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { CourriersService } from './courriers.service';
import { CreateCourrierDto } from './dto/create-courrier.dto';
import { AssignCourrierDto } from './dto/assign-courrier.dto';
import { ValidateCourrierDto } from './dto/validate-courrier.dto';
import { UploadService } from './services/upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/schemas/user.schema';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('courriers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CourriersController {
  constructor(
    private courriersService: CourriersService,
    private uploadService: UploadService,
  ) {}

  @Post()
  @Roles(Role.BO, Role.SUPER_ADMIN)
  async create(@Body() dto: CreateCourrierDto, @Req() req: Request) {
    const user = req.user as { _id: { toString: () => string } };
    return this.courriersService.create(dto, user._id.toString());
  }

  @Get()
  @Roles(Role.BO, Role.SUPER_ADMIN, Role.DIRECTEUR, Role.CHEF, Role.AGENT)
  async findAll() {
    return this.courriersService.findAll();
  }

  @Get(':id')
  @Roles(Role.BO, Role.SUPER_ADMIN, Role.DIRECTEUR, Role.CHEF, Role.AGENT)
  async findById(@Param('id') id: string) {
    return this.courriersService.findById(id);
  }

  @Post('documents/upload')
  @Roles(Role.BO, Role.SUPER_ADMIN)
  @UseInterceptors(FileInterceptor('file', new UploadService().getMulterOptions()))
  async uploadDocument(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }
    const url = new UploadService().buildUrl(file.filename);
    return { url, filename: file.filename, originalName: file.originalname };
  }

  @Post('extraire')
  @Roles(Role.BO, Role.SUPER_ADMIN)
  async extractStandalone(@Body() body: { url: string; mimeType: string }) {
    const uploadService = new UploadService();
    const relativePath = uploadService.getRelativePath(body.url.split('/').pop() || '');
    return this.courriersService.extractFromDocument(relativePath, body.mimeType);
  }

  @Post(':id/extraire')
  @Roles(Role.BO, Role.SUPER_ADMIN)
  async extract(@Param('id') id: string, @Body() body: { url: string; mimeType: string }) {
    const uploadService = new UploadService();
    const relativePath = uploadService.getRelativePath(body.url.split('/').pop() || '');
    const extraction = await this.courriersService.extractFromDocument(relativePath, body.mimeType);
    return this.courriersService.storeExtraction(id, extraction);
  }

  @Patch(':id/documents')
  @Roles(Role.BO, Role.SUPER_ADMIN)
  async attachDocument(@Param('id') id: string, @Body('url') url: string) {
    return this.courriersService.attachDocument(id, url);
  }

  @Get('directeur/pending')
  @Roles(Role.DIRECTEUR, Role.SUPER_ADMIN)
  async findPendingForDirector() {
    return this.courriersService.findPendingForDirector();
  }

  @Get(':id/recommandations')
  @Roles(Role.DIRECTEUR, Role.SUPER_ADMIN)
  async getRecommendations(@Param('id') id: string) {
    return this.courriersService.getRecommendations(id);
  }

  @Patch(':id/affecter')
  @Roles(Role.DIRECTEUR, Role.SUPER_ADMIN)
  async assignService(@Param('id') id: string, @Body() dto: AssignCourrierDto, @Req() req: Request) {
    const user = req.user as { _id: { toString: () => string } };
    return this.courriersService.assignService(id, dto, user._id.toString());
  }

  @Patch(':id/valider')
  @Roles(Role.DIRECTEUR, Role.SUPER_ADMIN)
  async validateDirector(@Param('id') id: string, @Body() dto: ValidateCourrierDto, @Req() req: Request) {
    const user = req.user as { _id: { toString: () => string } };
    return this.courriersService.validateDirector(id, dto, user._id.toString());
  }
}
