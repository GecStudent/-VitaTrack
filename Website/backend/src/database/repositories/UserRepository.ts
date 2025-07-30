import { User } from '../models/User';
import { BaseRepository } from './BaseRepository';
import { FindOptionsWhere } from 'typeorm';
import { deleteCache } from '../cache/redisCache';

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super(User);
  }

  async findByEmail(email: string, useCache = true): Promise<User | null> {
    console.log('UserRepository.findByEmail called with email:', email, 'useCache:', useCache);
    const result = await this.findOne({
      where: { email } as FindOptionsWhere<User>,
    }, useCache);
    console.log('UserRepository.findByEmail result:', result);
    return result;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | null> {
    const result = await super.update(id, data);
    // Invalidate cache
    await deleteCache(`user:${id}`);
    return result;
  }
}

const userRepository = new UserRepository();
export default userRepository;