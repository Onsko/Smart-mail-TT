import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CourriersController } from './courriers.controller';
import { CourriersService } from './courriers.service';
import { Courrier, CourrierSchema } from './schemas/courrier.schema';
import { Counter, CounterSchema } from './schemas/counter.schema';
import { Service, ServiceSchema } from '../services/schemas/service.schema';
import { ReferenceService } from './services/reference.service';
import { OcrService } from './services/ocr.service';
import { UploadService } from './services/upload.service';
import { SummarizationService } from './services/summarization.service';
import { RecommendationService } from './services/recommendation.service';
import { OllamaService } from './services/ollama.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Courrier.name, schema: CourrierSchema },
      { name: Counter.name, schema: CounterSchema },
      { name: Service.name, schema: ServiceSchema },
    ]),
  ],
  controllers: [CourriersController],
  providers: [CourriersService, ReferenceService, OcrService, UploadService, SummarizationService, RecommendationService, OllamaService],
  exports: [CourriersService, ReferenceService, OcrService, UploadService, SummarizationService, RecommendationService, OllamaService],
})
export class CourriersModule {}
