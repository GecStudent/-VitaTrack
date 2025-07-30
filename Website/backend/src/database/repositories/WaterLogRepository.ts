import { WaterLog } from '../models/WaterLog';
import { BaseRepository } from './BaseRepository';
import { Between, FindOptionsWhere, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';

export class WaterLogRepository extends BaseRepository<WaterLog> {
  constructor() {
    super(WaterLog);
  }

  async findByUserId(userId: string): Promise<WaterLog[]> {
    return this.find({
      where: { userId } as FindOptionsWhere<WaterLog>,
      order: { logTime: 'DESC' },
    });
  }

  async findByDateRange(userId: string, startDate: Date, endDate: Date): Promise<WaterLog[]> {
    return this.find({
      where: {
        userId,
        logTime: Between(startDate, endDate),
      } as FindOptionsWhere<WaterLog>,
      order: { logTime: 'ASC' },
    });
  }

  async findByDate(userId: string, date: Date): Promise<WaterLog[]> {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    return this.findByDateRange(userId, startDate, endDate);
  }

  async getTotalWaterIntakeByDate(userId: string, date: Date): Promise<number> {
    const logs = await this.findByDate(userId, date);
    return logs.reduce((total, log) => total + log.amount, 0);
  }

  async getTotalWaterIntakeByDateRange(userId: string, startDate: Date, endDate: Date): Promise<number> {
    const logs = await this.findByDateRange(userId, startDate, endDate);
    return logs.reduce((total, log) => total + log.amount, 0);
  }

  async getLatestWaterLog(userId: string): Promise<WaterLog | null> {
    return this.findOne({
      where: { userId } as FindOptionsWhere<WaterLog>,
      order: { logTime: 'DESC' },
    });
  }

  async deleteByUserId(userId: string): Promise<boolean> {
    try {
      const result = await this.repository.delete({ userId } as any);
      return result.affected !== null && result.affected !== undefined && result.affected > 0;
    } catch (error) {
      console.error('Error deleting water logs by user ID:', error);
      return false;
    }
  }
}

export default new WaterLogRepository();