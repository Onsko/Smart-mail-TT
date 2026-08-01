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

  @Get('suivi/:reference')
  @Roles(Role.CLIENT, Role.SUPER_ADMIN)
  async findByReference(@Param('reference') reference: string) {
    return this.courriersService.findByReference(reference);
  }

  @Get('stats')
  @Roles(Role.BO, Role.SUPER_ADMIN, Role.DIRECTEUR)
  async getStats() {
    return this.courriersService.getStats();
  }

  @Get('chef/stats')
  @Roles(Role.CHEF, Role.SUPER_ADMIN)
  async getChefStats(@Req() req: Request) {
    const user = req.user as { _id: { toString: () => string } };
    return this.courriersService.getChefStats(user._id.toString());
  }

  @Get('agent/stats')
  @Roles(Role.AGENT, Role.SUPER_ADMIN)
  async getAgentStats(@Req() req: Request) {
    const user = req.user as { _id: { toString: () => string } };
    return this.courriersService.getAgentStats(user._id.toString());
  }

  @Get(':id')
  @Roles(Role.BO, Role.SUPER_ADMIN, Role.DIRECTEUR, Role.CHEF, Role.AGENT)
  async findById(@Param('id') id: string) {
    return this.courriersService.findById(id);
  }

  @Post('documents/upload')
  @Roles(Role.BO, Role.SUPER_ADMIN, Role.AGENT)
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

  @Get('ollama/status')
  @Roles(Role.BO, Role.SUPER_ADMIN, Role.DIRECTEUR, Role.AGENT)
  async ollamaStatus() {
    return this.courriersService.getOllamaStatus();
  }

  @Post('ia/reformuler')
  @Roles(Role.AGENT, Role.SUPER_ADMIN)
  async reformuler(@Body() body: { text: string }) {
    return this.courriersService.reformulerTexte(body.text);
  }

  @Post('ia/resumer')
  @Roles(Role.AGENT, Role.SUPER_ADMIN)
  async resumer(@Body() body: { text: string }) {
    return this.courriersService.resumerTexte(body.text);
  }

  @Post('ia/traduire')
  @Roles(Role.AGENT, Role.SUPER_ADMIN)
  async traduire(@Body() body: { text: string; targetLang: string }) {
    return this.courriersService.traduireTexte(body.text, body.targetLang);
  }

  @Post('ia/chat')
  @Roles(Role.CLIENT, Role.BO, Role.SUPER_ADMIN, Role.DIRECTEUR, Role.CHEF, Role.AGENT)
  async chat(@Body() body: { message: string; context?: { page?: string } }, @Req() req: Request) {
    const user = req.user as { role?: string } | undefined;
    const role = user?.role || 'CLIENT';
    return this.courriersService.chatAssistant(body.message, role, body.context);
  }

  @Post('ia/generer-reponse')
  @Roles(Role.AGENT, Role.SUPER_ADMIN)
  async genererReponse(@Body() body: { objet: string; contenu: string }) {
    return this.courriersService.genererReponseIA(body.objet, body.contenu);
  }

  @Post('analyse-ollama')
  @Roles(Role.BO, Role.SUPER_ADMIN)
  async analyseOllama(@Body() body: { url: string; mimeType: string }) {
    const uploadService = new UploadService();
    const relativePath = uploadService.getRelativePath(body.url.split('/').pop() || '');
    return this.courriersService.analyzeWithOllama(relativePath, body.mimeType);
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
  @Roles(Role.BO, Role.SUPER_ADMIN, Role.AGENT)
  async attachDocument(@Param('id') id: string, @Body('url') url: string) {
    return this.courriersService.attachDocument(id, url);
  }

  @Get('directeur/pending')
  @Roles(Role.DIRECTEUR, Role.SUPER_ADMIN)
  async findPendingForDirector() {
    return this.courriersService.findPendingForDirector();
  }

  @Get('chef/mes-courriers')
  @Roles(Role.CHEF, Role.SUPER_ADMIN)
  async findForChef(@Req() req: Request) {
    const user = req.user as { _id: { toString: () => string } };
    return this.courriersService.findForChef(user._id.toString());
  }

  @Get('chef/agents-charge')
  @Roles(Role.CHEF, Role.SUPER_ADMIN)
  async getAgentsCharge(@Req() req: Request) {
    const user = req.user as { _id: { toString: () => string } };
    return this.courriersService.getAgentsCharge(user._id.toString());
  }

  @Get('agent/mes-courriers')
  @Roles(Role.AGENT, Role.SUPER_ADMIN)
  async findForAgent(@Req() req: Request) {
    const user = req.user as { _id: { toString: () => string } };
    return this.courriersService.findForAgent(user._id.toString());
  }

  @Post(':id/assigner-agent')
  @Roles(Role.CHEF, Role.SUPER_ADMIN)
  async assignAgent(@Param('id') id: string, @Body() body: { agentId: string }, @Req() req: Request) {
    const user = req.user as { _id: { toString: () => string } };
    return this.courriersService.assignAgent(id, body.agentId, user._id.toString());
  }

  @Get(':id/recommandations')
  @Roles(Role.DIRECTEUR, Role.SUPER_ADMIN)
  async getRecommendations(@Param('id') id: string) {
    return this.courriersService.getRecommendations(id);
  }

  @Post(':id/reanalyser-ollama')
  @Roles(Role.DIRECTEUR, Role.SUPER_ADMIN, Role.BO)
  async reanalyserOllama(@Param('id') id: string) {
    return this.courriersService.reanalyserAvecOllama(id);
  }

  @Patch(':id/affecter')
  @Roles(Role.DIRECTEUR, Role.SUPER_ADMIN)
  async assignService(@Param('id') id: string, @Body() dto: AssignCourrierDto, @Req() req: Request) {
    const user = req.user as { _id: { toString: () => string } };
    return this.courriersService.assignService(id, dto, user._id.toString());
  }

  @Patch(':id/statut')
  @Roles(Role.AGENT, Role.CHEF, Role.SUPER_ADMIN)
  async updateStatut(@Param('id') id: string, @Body() body: { statut: string }, @Req() req: Request) {
    const user = req.user as { _id: { toString: () => string } };
    return this.courriersService.updateStatut(id, body.statut, user._id.toString());
  }

  @Patch(':id/reponse')
  @Roles(Role.AGENT, Role.SUPER_ADMIN)
  async saveReponse(@Param('id') id: string, @Body() body: { reponse: string; envoyer: boolean }, @Req() req: Request) {
    const user = req.user as { _id: { toString: () => string } };
    return this.courriersService.saveReponse(id, body.reponse, body.envoyer, user._id.toString());
  }

  @Patch(':id/valider')
  @Roles(Role.DIRECTEUR, Role.SUPER_ADMIN)
  async validateDirector(@Param('id') id: string, @Body() dto: ValidateCourrierDto, @Req() req: Request) {
    const user = req.user as { _id: { toString: () => string } };
    return this.courriersService.validateDirector(id, dto, user._id.toString());
  }
}
