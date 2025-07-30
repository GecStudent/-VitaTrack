import { UserDailyTarget } from '../models/UserDailyTarget';
import { BaseRepository } from './BaseRepository';
import { FindOptionsWhere } from 'typeorm';

export class UserDailyTargetRepository extends BaseRepository<UserDailyTarget> {
  constructor() {
    super(UserDailyTarget);
  }

  async findByUserId(userId: string): Promise<UserDailyTarget | null> {
    return this.findOne({
      where: { userId } as FindOptionsWhere<UserDailyTarget>,
    });
  }

  async getWaterTarget(userId: string): Promise<number | null> {
    const target = await this.findByUserId(userId);
    return target ? target.waterMl : null;
  }

  async updateWaterTarget(userId: string, waterMl: number): Promise<UserDailyTarget> {
    const existingTarget = await this.findByUserId(userId);
    
    if (existingTarget) {
      const updated = await this.update(existingTarget.id, { waterMl });
      return updated as UserDailyTarget;
    } else {
      return this.create({
        userId,
        waterMl
      });
    }
  }
}

export default new UserDailyTargetRepository();