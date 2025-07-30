import { WeightLog } from '../models/WeightLog';
import { BaseRepository } from './BaseRepository';
import { Between, FindOptionsWhere } from 'typeorm';

export class WeightLogRepository extends BaseRepository<WeightLog> {
  constructor() {
    super(WeightLog);
  }

  async findByUserId(userId: string): Promise<WeightLog[]> {
    return this.find({
      where: { userId } as FindOptionsWhere<WeightLog>,
      order: { logDate: 'DESC' },
    });
  }

  async findByDateRange(userId: string, startDate: Date, endDate: Date): Promise<WeightLog[]> {
    return this.find({
      where: {
        userId,
        logDate: Between(startDate, endDate),
      } as FindOptionsWhere<WeightLog>,
      order: { logDate: 'ASC' },
    });
  }

  async getLatestWeight(userId: string): Promise<WeightLog | null> {
    return this.findOne({
      where: { userId } as FindOptionsWhere<WeightLog>,
      order: { logDate: 'DESC' },
    });
  }

  async deleteByUserId(userId: string): Promise<boolean> {
    try {
      const result = await this.repository.delete({ userId } as any);
      return result.affected !== null && result.affected !== undefined && result.affected > 0;
    } catch (error) {
      console.error('Error deleting weight logs by user ID:', error);
      return false;
    }
  }
}

export default new WeightLogRepository();