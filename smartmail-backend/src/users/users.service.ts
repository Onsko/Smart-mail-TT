import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).select('-password').exec();
  }

  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().select('-password').exec();
  }

  async create(dto: CreateUserDto): Promise<UserDocument> {
    const exists = await this.findByEmail(dto.email);
    if (exists) throw new ConflictException('Un utilisateur avec cet email existe déjà');

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = new this.userModel({
      ...dto,
      email: dto.email.toLowerCase(),
      password: hashedPassword,
    });
    await user.save();
    return this.userModel.findById(user._id).select('-password').exec() as Promise<UserDocument>;
  }

  async updateStatus(id: string, actif: boolean): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(id, { actif }, { new: true })
      .select('-password')
      .exec();
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return user;
  }

  async updateRole(id: string, role: string): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(id, { role }, { new: true })
      .select('-password')
      .exec();
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    return user;
  }

  async delete(id: string): Promise<void> {
    const res = await this.userModel.findByIdAndDelete(id).exec();
    if (!res) throw new NotFoundException('Utilisateur introuvable');
  }

  async setResetCode(email: string, code: string, expiresAt: Date): Promise<UserDocument | null> {
    return this.userModel
      .findOneAndUpdate(
        { email: email.toLowerCase() },
        { resetCode: code, resetCodeExpires: expiresAt },
        { new: true },
      )
      .exec();
  }

  async clearResetCode(email: string): Promise<void> {
    await this.userModel
      .findOneAndUpdate(
        { email: email.toLowerCase() },
        { resetCode: null, resetCodeExpires: null },
      )
      .exec();
  }

  async updatePassword(email: string, newPassword: string): Promise<UserDocument | null> {
    const hashed = await bcrypt.hash(newPassword, 10);
    return this.userModel
      .findOneAndUpdate(
        { email: email.toLowerCase() },
        { password: hashed, resetCode: null, resetCodeExpires: null },
        { new: true },
      )
      .select('-password')
      .exec();
  }
}
