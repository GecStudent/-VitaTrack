import { BodyMeasurement } from '../models/BodyMeasurement';
import { BaseRepository } from './BaseRepository';
import { Between, FindOptionsWhere } from 'typeorm';

export class BodyMeasurementRepository extends BaseRepository<BodyMeasurement> {
  constructor() {
    super(BodyMeasurement);
  }

  async findByUserId(userId: string): Promise<BodyMeasurement[]> {
    return this.find({
      where: { userId } as FindOptionsWhere<BodyMeasurement>,
      order: { logDate: 'DESC' },
    });
  }

  async findByDateRange(userId: string, startDate: Date, endDate: Date): Promise<BodyMeasurement[]> {
    return this.find({
      where: {
        userId,
        logDate: Between(startDate, endDate),
      } as FindOptionsWhere<BodyMeasurement>,
      order: { logDate: 'ASC' },
    });
  }

  async getLatestMeasurements(userId: string): Promise<BodyMeasurement | null> {
    return this.findOne({
      where: { userId } as FindOptionsWhere<BodyMeasurement>,
      order: { logDate: 'DESC' },
    });
  }
}

export default new BodyMeasurementRepository();