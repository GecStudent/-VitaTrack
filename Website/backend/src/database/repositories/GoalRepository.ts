import { Goal } from '../models/Goal';
import { BaseRepository } from './BaseRepository';
import { FindOptionsWhere } from 'typeorm';
import { deleteCache } from '../cache/redisCache';

export class GoalRepository extends BaseRepository<Goal> {
  constructor() {
    super(Goal);
  }

  async findByUserId(userId: string): Promise<Goal[]> {
    return this.find({
      where: { user_id: userId } as FindOptionsWhere<Goal>,
      order: { created_at: 'DESC' }
    });
  }

  async findActiveGoals(userId: string, goalType?: string): Promise<Goal[]> {
    const where: Record<string, unknown> = { 
      user_id: userId,
      status: 'active'
    };
    
    if (goalType) {
      where.goal_type = goalType;
    }
    
    return this.find({
      where: where as FindOptionsWhere<Goal>,
      order: { created_at: 'DESC' }
    });
  }

  async updateGoal(id: string, data: Partial<Goal>): Promise<Goal | null> {
    const result = await super.update(id, data);
    // Invalidate cache
    await deleteCache(`goal:${id}`);
    return result;
  }
  
  async completeGoal(id: string): Promise<Goal | null> {
    return this.updateGoal(id, { 
      status: 'completed',
      updated_at: new Date()
    });
  }

  async deleteByUserId(userId: string): Promise<boolean> {
    try {
      const result = await this.repository.delete({ user_id: userId } as any);
      return result.affected !== null && result.affected !== undefined && result.affected > 0;
    } catch (error) {
      console.error('Error deleting goals by user ID:', error);
      return false;
    }
  }
}

export default new GoalRepository();