import { Repository, EntityTarget, FindOptionsWhere, FindOneOptions, ObjectLiteral } from 'typeorm';
import { AppDataSource } from '../connection';
import { getCache, setCache } from '../cache/redisCache';

export class BaseRepository<T extends ObjectLiteral> {
  protected repository: Repository<T>;
  protected entityName: string;

  constructor(entity: EntityTarget<T>) {
    this.repository = AppDataSource.getRepository(entity);
    this.entityName = entity.toString().split(' ')[1];
  }

  async findById(id: string, useCache = true): Promise<T | null> {
    if (useCache) {
      const cacheKey = `${this.entityName.toLowerCase()}:${id}`;
      const cachedEntity = await getCache<T>(cacheKey);
      if (cachedEntity) return cachedEntity;
    }

    const entity = await this.repository.findOneBy({ id } as unknown as FindOptionsWhere<T>);
    
    if (entity && useCache) {
      const cacheKey = `${this.entityName.toLowerCase()}:${id}`;
      await setCache(cacheKey, entity);
    }
    
    return entity;
  }

  async findOne(options: FindOneOptions<T>, useCache = false): Promise<T | null> {
    console.log('BaseRepository.findOne called with options:', JSON.stringify(options), 'useCache:', useCache);
    
    if (useCache && options.where && typeof options.where === 'object') {
      const cacheKey = `${this.entityName.toLowerCase()}:findOne:${JSON.stringify(options.where)}`;
      console.log('Checking cache with key:', cacheKey);
      const cachedEntity = await getCache<T>(cacheKey);
      if (cachedEntity) {
        console.log('Found cached entity:', cachedEntity);
        return cachedEntity;
      }
    }

    console.log('Executing database query...');
    const entity = await this.repository.findOne(options);
    console.log('Database query result:', entity);
    
    if (entity && useCache && options.where && typeof options.where === 'object') {
      const cacheKey = `${this.entityName.toLowerCase()}:findOne:${JSON.stringify(options.where)}`;
      await setCache(cacheKey, entity);
    }
    
    return entity;
  }

  async find(options?: any): Promise<T[]> {
    return this.repository.find(options);
  }

  async create(data: Partial<T>): Promise<T> {
    const entity = this.repository.create(data as any);
    return this.repository.save(entity as any);
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    await this.repository.update(id, data as any);
    return this.findById(id, false);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete(id);
    return result.affected !== null && result.affected !== undefined && result.affected > 0;
  }
}