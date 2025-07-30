import { MealLog } from '../models/MealLog';
import { BaseRepository } from './BaseRepository';
import { Between, FindOptionsWhere } from 'typeorm';
import { deleteCache } from '../cache/redisCache';

export class MealLogRepository extends BaseRepository<MealLog> {
  constructor() {
    super(MealLog);
  }

  async findByUserId(userId: string): Promise<MealLog[]> {
    return this.find({
      where: { userId } as FindOptionsWhere<MealLog>,
      order: { logDate: 'DESC' },
      relations: ['mealItems']
    });
  }

  async findByDateRange(userId: string, startDate: Date, endDate: Date): Promise<MealLog[]> {
    return this.find({
      where: {
        userId,
        logDate: Between(startDate, endDate),
      } as FindOptionsWhere<MealLog>,
      order: { logDate: 'ASC' },
      relations: ['mealItems']
    });
  }

  async findByDate(userId: string, date: Date): Promise<MealLog[]> {
    // Create start and end date for the given date (full day)
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    return this.findByDateRange(userId, startDate, endDate);
  }

  async findByMealType(userId: string, mealType: string): Promise<MealLog[]> {
    return this.find({
      where: {
        userId,
        mealType
      } as FindOptionsWhere<MealLog>,
      order: { logDate: 'DESC' },
      relations: ['mealItems']
    });
  }

  async deleteMealLog(id: string, userId: string): Promise<boolean> {
    // First verify the meal log belongs to the user
    const mealLog = await this.findOne({
      where: { id, userId } as FindOptionsWhere<MealLog>
    });

    if (!mealLog) return false;

    // Delete the meal log
    const result = await super.delete(id);
    
    // Invalidate cache
    await deleteCache(`meallog:${id}`);
    
    return result;
  }

  async deleteByUserId(userId: string): Promise<boolean> {
    try {
      const result = await this.repository.delete({ userId } as any);
      return result.affected !== null && result.affected !== undefined && result.affected > 0;
    } catch (error) {
      console.error('Error deleting meal logs by user ID:', error);
      return false;
    }
  }
}

export default new MealLogRepository();