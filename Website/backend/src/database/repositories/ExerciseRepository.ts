import { Exercise } from '../models/Exercise';
import { BaseRepository } from './BaseRepository';
import { FindOptionsWhere, Like } from 'typeorm';

export class ExerciseRepository extends BaseRepository<Exercise> {
  constructor() {
    super(Exercise);
  }

  async findByCategory(category: string): Promise<Exercise[]> {
    return this.find({
      where: { category } as FindOptionsWhere<Exercise>,
      order: { name: 'ASC' },
    });
  }

  async findByMuscleGroup(muscleGroup: string): Promise<Exercise[]> {
    return this.find({
      where: { muscleGroup } as FindOptionsWhere<Exercise>,
      order: { name: 'ASC' },
    });
  }

  async findByEquipment(equipment: string): Promise<Exercise[]> {
    return this.find({
      where: { equipment } as FindOptionsWhere<Exercise>,
      order: { name: 'ASC' },
    });
  }

  async findByDifficulty(difficulty: string): Promise<Exercise[]> {
    return this.find({
      where: { difficulty } as FindOptionsWhere<Exercise>,
      order: { name: 'ASC' },
    });
  }

  async searchExercises(searchTerm: string): Promise<Exercise[]> {
    return this.find({
      where: [
        { name: Like(`%${searchTerm}%`) } as FindOptionsWhere<Exercise>,
        { category: Like(`%${searchTerm}%`) } as FindOptionsWhere<Exercise>,
        { muscleGroup: Like(`%${searchTerm}%`) } as FindOptionsWhere<Exercise>,
        { equipment: Like(`%${searchTerm}%`) } as FindOptionsWhere<Exercise>,
      ],
      order: { name: 'ASC' },
    });
  }
}

// Create a singleton instance
const exerciseRepository = new ExerciseRepository();
export default exerciseRepository;