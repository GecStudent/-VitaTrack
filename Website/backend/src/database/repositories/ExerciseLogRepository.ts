import { ExerciseLog } from '../models/ExerciseLog';
import { BaseRepository } from './BaseRepository';
import { Between, FindOptionsWhere } from 'typeorm';

export class ExerciseLogRepository extends BaseRepository<ExerciseLog> {
  constructor() {
    super(ExerciseLog);
  }

  async findByUserId(userId: string): Promise<ExerciseLog[]> {
    return this.find({
      where: { userId } as FindOptionsWhere<ExerciseLog>,
      order: { logDate: 'DESC' },
      relations: ['exercise'],
    });
  }

  async findByDateRange(userId: string, startDate: Date, endDate: Date): Promise<ExerciseLog[]> {
    return this.find({
      where: {
        userId,
        logDate: Between(startDate, endDate),
      } as FindOptionsWhere<ExerciseLog>,
      order: { logDate: 'ASC' },
      relations: ['exercise'],
    });
  }

  async findByDate(userId: string, date: Date): Promise<ExerciseLog[]> {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    return this.findByDateRange(userId, startDate, endDate);
  }

  async findByExerciseId(userId: string, exerciseId: string): Promise<ExerciseLog[]> {
    return this.find({
      where: { userId, exerciseId } as FindOptionsWhere<ExerciseLog>,
      order: { logDate: 'DESC' },
      relations: ['exercise'],
    });
  }

  async getPersonalRecords(userId: string, exerciseId: string): Promise<ExerciseLog | null> {
    // Find the record with the highest weight for the given exercise
    return this.findOne({
      where: { userId, exerciseId } as FindOptionsWhere<ExerciseLog>,
      order: { weight: 'DESC' },
      relations: ['exercise'],
    });
  }

  async getCaloriesBurnedByDateRange(userId: string, startDate: Date, endDate: Date): Promise<number> {
    const logs = await this.findByDateRange(userId, startDate, endDate);
    return logs.reduce((total, log) => total + log.caloriesBurned, 0);
  }

  async deleteByUserId(userId: string): Promise<boolean> {
    try {
      const result = await this.repository.delete({ userId } as any);
      return result.affected !== null && result.affected !== undefined && result.affected > 0;
    } catch (error) {
      console.error('Error deleting exercise logs by user ID:', error);
      return false;
    }
  }
}

// Create a singleton instance
const exerciseLogRepository = new ExerciseLogRepository();
export default exerciseLogRepository;