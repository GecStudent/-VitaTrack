import express from 'express';
import { Request, Response } from 'express';
import Joi from 'joi';
import { JwtPayload } from '../../auth/types';
import { registerSchema } from '../../middleware/requestValidator';
import exerciseRepository from '../../database/repositories/ExerciseRepository';
import { AuditLogger } from '../../utils/auditLogger';

const router = express.Router();

// Schema for custom exercise creation
const customExerciseSchema = Joi.object({
  body: Joi.object({
    name: Joi.string().min(3).max(100).required(),
    category: Joi.string().required(),
    muscleGroup: Joi.string().required(),
    equipment: Joi.string().required(),
    difficulty: Joi.string().valid('beginner', 'intermediate', 'advanced').required(),
    instructions: Joi.string().required(),
    caloriesPerMin: Joi.number().positive().required(),
  }),
});

// Register schema for POST /api/exercises/custom
registerSchema('POST:/api/exercises/custom', customExerciseSchema);

// GET /api/exercises - Get exercise library
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, muscleGroup, equipment, difficulty, search } = req.query;
    
    let exercises;
    
    if (search) {
      // Search exercises by term
      exercises = await exerciseRepository.searchExercises(search as string);
    } else if (category) {
      // Filter by category
      exercises = await exerciseRepository.findByCategory(category as string);
    } else if (muscleGroup) {
      // Filter by muscle group
      exercises = await exerciseRepository.findByMuscleGroup(muscleGroup as string);
    } else if (equipment) {
      // Filter by equipment
      exercises = await exerciseRepository.findByEquipment(equipment as string);
    } else if (difficulty) {
      // Filter by difficulty
      exercises = await exerciseRepository.findByDifficulty(difficulty as string);
    } else {
      // Get all exercises
      exercises = await exerciseRepository.find({
        order: { category: 'ASC', name: 'ASC' },
      });
    }
    
    res.json(exercises);
  } catch (error) {
    console.error('Get exercises error:', error);
    res.status(500).json({ error: 'Failed to get exercises' });
  }
});

// GET /api/exercises/:id - Get exercise details
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const exercise = await exerciseRepository.findById(id);
    
    if (!exercise) {
      return res.status(404).json({ error: 'Exercise not found' });
    }
    
    res.json(exercise);
  } catch (error) {
    console.error('Get exercise details error:', error);
    res.status(500).json({ error: 'Failed to get exercise details' });
  }
});

// POST /api/exercises/custom - Create custom exercise
router.post('/custom', async (req: Request, res: Response) => {
  try {
    const user = req.user as JwtPayload;
    const userId = user.sub;
    const { name, category, muscleGroup, equipment, difficulty, instructions, caloriesPerMin } = req.body;
    
    // Create custom exercise
    const exercise = await exerciseRepository.create({
      name,
      category,
      muscleGroup,
      equipment,
      difficulty,
      instructions,
      caloriesPerMin,
    });
    
    // Log the creation of custom exercise
    AuditLogger.log('custom_exercise_created', {
      userId,
      exerciseId: exercise.id,
      exerciseName: name,
    });
    
    res.status(201).json(exercise);
  } catch (error) {
    console.error('Create custom exercise error:', error);
    res.status(500).json({ error: 'Failed to create custom exercise' });
  }
});

export default router;