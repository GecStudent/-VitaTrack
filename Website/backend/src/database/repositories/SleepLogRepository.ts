import { SleepLog } from '../models/SleepLog';
import { BaseRepository } from './BaseRepository';
import { Between, FindOptionsWhere } from 'typeorm';

export class SleepLogRepository extends BaseRepository<SleepLog> {
  constructor() {
    super(SleepLog);
  }

  async findByUserId(userId: string): Promise<SleepLog[]> {
    return this.find({
      where: { userId } as FindOptionsWhere<SleepLog>,
      order: { sleepStart: 'DESC' },
    });
  }

  async findByDateRange(userId: string, startDate: Date, endDate: Date): Promise<SleepLog[]> {
    return this.find({
      where: {
        userId,
        logDate: Between(startDate, endDate),
      } as FindOptionsWhere<SleepLog>,
      order: { sleepStart: 'DESC' },
    });
  }

  async findByDate(userId: string, date: Date): Promise<SleepLog[]> {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    return this.findByDateRange(userId, startDate, endDate);
  }

  async getTotalSleepDurationByDate(userId: string, date: Date): Promise<number> {
    const sleepLogs = await this.findByDate(userId, date);
    
    return sleepLogs.reduce((total, log) => {
      const duration = (log.sleepEnd.getTime() - log.sleepStart.getTime()) / (1000 * 60); // Convert to minutes
      return total + duration;
    }, 0);
  }

  async getAverageSleepQuality(userId: string, startDate: Date, endDate: Date): Promise<number> {
    const sleepLogs = await this.findByDateRange(userId, startDate, endDate);
    
    if (sleepLogs.length === 0) return 0;
    
    const totalQuality = sleepLogs.reduce((sum, log) => sum + log.quality, 0);
    return totalQuality / sleepLogs.length;
  }

  async getLatestSleepLog(userId: string): Promise<SleepLog | null> {
    return this.findOne({
      where: { userId } as FindOptionsWhere<SleepLog>,
      order: { sleepStart: 'DESC' },
    });
  }

  async deleteByUserId(userId: string): Promise<boolean> {
    try {
      const result = await this.repository.delete({ userId } as any);
      return result.affected !== null && result.affected !== undefined && result.affected > 0;
    } catch (error) {
      console.error('Error deleting sleep logs by user ID:', error);
      return false;
    }
  }
}

const sleepLogRepository = new SleepLogRepository();
export default sleepLogRepository;