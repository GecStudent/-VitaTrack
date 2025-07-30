import express from 'express';
import { Request, Response } from 'express';
import Joi from 'joi';
import { JwtPayload } from '../../auth/types';
import { registerSchema } from '../../middleware/requestValidator';
import waterLogRepository from '../../database/repositories/WaterLogRepository';
import { AuditLogger } from '../../utils/auditLogger';

const router = express.Router();

// Schema for device pairing
const devicePairingSchema = Joi.object({
  body: Joi.object({
    deviceId: Joi.string().required(),
    deviceType: Joi.string().valid('hidrate_spark', 'thermos_smart_lid', 'water_bob', 'ozmo', 'h2opal', 'generic_bluetooth').required(),
    deviceName: Joi.string().required(),
  }),
});

// Schema for device data sync
const deviceSyncSchema = Joi.object({
  body: Joi.object({
    deviceId: Joi.string().required(),
    data: Joi.array().items(
      Joi.object({
        amount: Joi.number().positive().required(),
        timestamp: Joi.date().iso().required(),
      })
    ).required(),
  }),
});

// Register schemas
registerSchema('POST:/api/water/smart-bottles/pair', devicePairingSchema);
registerSchema('POST:/api/water/smart-bottles/sync', deviceSyncSchema);

// GET /api/water/smart-bottles - Get paired devices
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = req.user as JwtPayload;
    const userId = user.sub;
    
    // In a real implementation, this would fetch from a database
    // For now, we'll return an empty array
    // This would typically be stored in user preferences or a dedicated table
    
    res.json([]);
  } catch (error) {
    console.error('Get paired devices error:', error);
    res.status(500).json({ error: 'Failed to get paired devices' });
  }
});

// POST /api/water/smart-bottles/pair - Pair a new device
router.post('/pair', async (req: Request, res: Response) => {
  try {
    const user = req.user as JwtPayload;
    const userId = user.sub;
    const { deviceId, deviceType, deviceName } = req.body;
    
    // In a real implementation, this would update the database
    // For now, we'll just log the pairing and return success
    
    // Log the device pairing
    AuditLogger.log('water_device_paired', {
      userId,
      deviceId,
      deviceType,
      deviceName,
    });
    
    res.status(201).json({
      success: true,
      device: {
        id: deviceId,
        type: deviceType,
        name: deviceName,
        pairedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Pair device error:', error);
    res.status(500).json({ error: 'Failed to pair device' });
  }
});

// DELETE /api/water/smart-bottles/:deviceId - Unpair a device
router.delete('/:deviceId', async (req: Request, res: Response) => {
  try {
    const user = req.user as JwtPayload;
    const userId = user.sub;
    const { deviceId } = req.params;
    
    // In a real implementation, this would update the database
    // For now, we'll just log the unpairing and return success
    
    // Log the device unpairing
    AuditLogger.log('water_device_unpaired', {
      userId,
      deviceId,
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Unpair device error:', error);
    res.status(500).json({ error: 'Failed to unpair device' });
  }
});

// POST /api/water/smart-bottles/sync - Sync data from a smart bottle
router.post('/sync', async (req: Request, res: Response) => {
  try {
    const user = req.user as JwtPayload;
    const userId = user.sub;
    const { deviceId, data } = req.body;
    
    // Process each water intake record
    const syncResults = [];
    
    for (const record of data) {
      // Create water log for each record
      const waterLog = await waterLogRepository.create({
        userId,
        amount: record.amount,
        logTime: new Date(record.timestamp),
      });
      
      syncResults.push({
        id: waterLog.id,
        amount: waterLog.amount,
        logTime: waterLog.logTime,
      });
    }
    
    // Log the device sync
    AuditLogger.log('water_device_sync', {
      userId,
      deviceId,
      recordsCount: data.length,
    });
    
    res.status(201).json({
      success: true,
      deviceId,
      syncedRecords: syncResults.length,
      records: syncResults,
    });
  } catch (error) {
    console.error('Sync device data error:', error);
    res.status(500).json({ error: 'Failed to sync device data' });
  }
});

// GET /api/water/smart-bottles/supported - Get list of supported devices
router.get('/supported', (req: Request, res: Response) => {
  const supportedDevices = [
    {
      id: 'hidrate_spark',
      name: 'Hidrate Spark',
      description: 'Smart water bottle that tracks water intake and glows to remind you to drink',
      features: ['automatic_tracking', 'reminders', 'led_glow'],
    },
    {
      id: 'thermos_smart_lid',
      name: 'Thermos Smart Lid',
      description: 'Smart lid that tracks water intake and syncs with the Thermos app',
      features: ['automatic_tracking', 'temperature_sensing'],
    },
    {
      id: 'water_bob',
      name: 'Water Bob',
      description: 'Smart water bottle with app connectivity',
      features: ['automatic_tracking', 'reminders'],
    },
    {
      id: 'ozmo',
      name: 'Ozmo Active',
      description: 'Smart bottle and app that tracks water and coffee consumption',
      features: ['automatic_tracking', 'vibration_alert', 'coffee_tracking'],
    },
    {
      id: 'h2opal',
      name: 'H2OPal',
      description: 'Smart water bottle attachment that tracks hydration',
      features: ['automatic_tracking', 'fits_any_bottle'],
    },
    {
      id: 'generic_bluetooth',
      name: 'Generic Bluetooth Bottle',
      description: 'Any Bluetooth-enabled water bottle',
      features: ['manual_tracking'],
    },
  ];
  
  res.json(supportedDevices);
});

export default router;