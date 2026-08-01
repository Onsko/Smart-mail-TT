import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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

  async findById(id: string): Promise<any | null> {
    const user = await this.userModel.findById(id).select('-password').lean().exec();
    if (!user) return null;
    if (user.service && Types.ObjectId.isValid(user.service.toString())) {
      const svc = await this.userModel.db.collection('services').findOne({ _id: new Types.ObjectId(user.service.toString()) });
      return {
        ...user,
        _id: user._id.toString(),
        service: svc ? { _id: svc._id.toString(), code: svc.code, name: svc.name } : null,
      };
    }
    return { ...user, _id: user._id.toString(), service: null };
  }

  async findAll(): Promise<any[]> {
    const users = await this.userModel.find().select('-password').lean().exec();
    // Manually populate service to avoid CastError on invalid ObjectId strings
    const serviceIds = users
      .map((u) => u.service)
      .filter((s) => s && Types.ObjectId.isValid(s.toString()));
    const uniqueIds = [...new Set(serviceIds.map((s) => s!.toString()))];
    const services = uniqueIds.length > 0
      ? await this.userModel.db.collection('services').find({ _id: { $in: uniqueIds.map((id) => new Types.ObjectId(id)) } }).toArray()
      : [];
    const serviceMap = new Map(services.map((s) => [s._id.toString(), s]));
    return users.map((u) => ({
      ...u,
      _id: u._id.toString(),
      service: u.service && Types.ObjectId.isValid(u.service.toString()) && serviceMap.has(u.service.toString())
        ? { _id: serviceMap.get(u.service.toString())!._id.toString(), code: serviceMap.get(u.service.toString())!.code, name: serviceMap.get(u.service.toString())!.name }
        : null,
    }));
  }

  async create(dto: CreateUserDto): Promise<any> {
    const exists = await this.findByEmail(dto.email);
    if (exists) throw new ConflictException('Un utilisateur avec cet email existe déjà');

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const userData: any = {
      nom: dto.nom,
      prenom: dto.prenom,
      email: dto.email.toLowerCase(),
      password: hashedPassword,
      role: dto.role,
    };
    // Only set service if it's a valid ObjectId string
    if (dto.service && Types.ObjectId.isValid(dto.service)) {
      userData.service = new Types.ObjectId(dto.service);
    }
    const user = new this.userModel(userData);
    await user.save();
    const saved = await this.userModel.findById(user._id).select('-password').lean().exec();
    if (!saved) throw new NotFoundException('Utilisateur introuvable après création');
    if (saved.service && Types.ObjectId.isValid(saved.service.toString())) {
      const svc = await this.userModel.db.collection('services').findOne({ _id: new Types.ObjectId(saved.service.toString()) });
      return { ...saved, _id: saved._id.toString(), service: svc ? { _id: svc._id.toString(), code: svc.code, name: svc.name } : null };
    }
    return { ...saved, _id: saved._id.toString(), service: null };
  }

  async updateStatus(id: string, actif: boolean): Promise<any> {
    const user = await this.userModel
      .findByIdAndUpdate(id, { actif }, { new: true })
      .select('-password')
      .lean()
      .exec();
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    if (user.service && Types.ObjectId.isValid(user.service.toString())) {
      const svc = await this.userModel.db.collection('services').findOne({ _id: new Types.ObjectId(user.service.toString()) });
      return { ...user, _id: user._id.toString(), service: svc ? { _id: svc._id.toString(), code: svc.code, name: svc.name } : null };
    }
    return { ...user, _id: user._id.toString(), service: null };
  }

  async updateRole(id: string, role: string): Promise<any> {
    const user = await this.userModel
      .findByIdAndUpdate(id, { role }, { new: true })
      .select('-password')
      .lean()
      .exec();
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    if (user.service && Types.ObjectId.isValid(user.service.toString())) {
      const svc = await this.userModel.db.collection('services').findOne({ _id: new Types.ObjectId(user.service.toString()) });
      return { ...user, _id: user._id.toString(), service: svc ? { _id: svc._id.toString(), code: svc.code, name: svc.name } : null };
    }
    return { ...user, _id: user._id.toString(), service: null };
  }

  async delete(id: string): Promise<void> {
    const res = await this.userModel.findByIdAndDelete(id).exec();
    if (!res) throw new NotFoundException('Utilisateur introuvable');
  }

  async getStats(): Promise<{ total: number; actifs: number; byRole: Record<string, number> }> {
    const [total, actifs, roleResult] = await Promise.all([
      this.userModel.countDocuments().exec(),
      this.userModel.countDocuments({ actif: true }).exec(),
      this.userModel.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]).exec(),
    ]);
    const byRole: Record<string, number> = {};
    roleResult.forEach((item: { _id: string; count: number }) => { byRole[item._id] = item.count; });
    return { total, actifs, byRole };
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
