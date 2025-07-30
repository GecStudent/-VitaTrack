import { MealItem } from '../models/MealItem';
import { BaseRepository } from './BaseRepository';
import { FindOptionsWhere } from 'typeorm';

export class MealItemRepository extends BaseRepository<MealItem> {
  constructor() {
    super(MealItem);
  }

  async findByMealLogId(mealLogId: string): Promise<MealItem[]> {
    return this.find({
      where: { mealLogId } as FindOptionsWhere<MealItem>
    });
  }

  async deleteByMealLogId(mealLogId: string): Promise<boolean> {
    const result = await this.repository.delete({ mealLogId } as FindOptionsWhere<MealItem>);
    return result.affected !== null && result.affected !== undefined && result.affected > 0;
  }
}

export default new MealItemRepository();