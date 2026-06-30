import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Counter, CounterDocument } from '../schemas/counter.schema';

@Injectable()
export class ReferenceService {
  constructor(@InjectModel(Counter.name) private counterModel: Model<CounterDocument>) {}

  async generateNext(): Promise<string> {
    const year = new Date().getFullYear();
    const counterName = `reference-${year}`;

    const counter = await this.counterModel.findOneAndUpdate(
      { name: counterName },
      { $inc: { value: 1 } },
      { new: true, upsert: true },
    );

    const sequence = counter.value.toString().padStart(6, '0');
    return `TT-${year}-${sequence}`;
  }
}
