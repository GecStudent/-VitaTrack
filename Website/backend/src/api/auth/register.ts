import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response } from 'express';
import {
  validateEmail,
  validatePassword,
  validatePersonalInfo,
  validateHealthMetrics,
  validateTermsAccepted,
  validateActivityLevel,
  validatePreferences
} from './validation';

import { sendVerificationEmail } from './email';
import { logConsent, minimizeData, logTermsAcceptance } from './gdpr';
import userRepository from '../../database/repositories/UserRepository';
import goalRepository from '../../database/repositories/GoalRepository';
import { AuditLogger } from '../../utils/auditLogger';

import {
  // Import the email verification token generator
  generateEmailVerificationToken
} from '../../auth/emailVerification';

const router = express.Router();

// Define interface for registration request body (unused but kept for future reference)
// interface RegisterRequestBody {
//   email: string;
//   password: string;
//   firstName: string;
//   lastName: string;
//   birthDate: string;
//   gender: string;
//   height: number;
//   currentWeight: number;
//   goalWeight: number;
//   activityLevel: string;
//   preferences?: Record<string, unknown>;
//   termsAccepted: boolean;
// }

/**
 * Calculate BMR (Basal Metabolic Rate) using the Mifflin-St Jeor Equation
 * @param gender User's gender
 * @param weight Weight in kg
 * @param height Height in cm
 * @param age Age in years
 * @returns BMR value
 */
function calculateBMR(gender: string, weight: number, height: number, age: number): number {
  if (gender.toLowerCase() === 'female') {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  } else {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  }
}

/**
 * Calculate daily calorie needs based on BMR and activity level
 * @param bmr Basal Metabolic Rate
 * @param activityLevel User's activity level
 * @returns Daily calorie needs
 */
function calculateDailyCalories(bmr: number, activityLevel: string): number {
  const activityMultipliers: Record<string, number> = {
    'sedentary': 1.2,
    'lightly_active': 1.375,
    'moderately_active': 1.55,
    'very_active': 1.725,
    'extremely_active': 1.9
  };
  
  const multiplier = activityMultipliers[activityLevel] || 1.2;
  return Math.round(bmr * multiplier);
}

/**
 * Calculate macronutrient distribution based on calorie needs
 * @param calories Daily calorie needs
 * @returns Object with protein, carbs, and fat in grams
 */
function calculateMacros(calories: number): { protein: number; carbs: number; fat: number } {
  // Default distribution: 30% protein, 40% carbs, 30% fat
  const protein = Math.round((calories * 0.3) / 4); // 4 calories per gram of protein
  const carbs = Math.round((calories * 0.4) / 4);   // 4 calories per gram of carbs
  const fat = Math.round((calories * 0.3) / 9);     // 9 calories per gram of fat
  
  return { protein, carbs, fat };
}

/**
 * Map frontend activity level values to database values
 * @param activityLevel Frontend activity level value
 * @returns Database-compatible activity level value
 */
function mapActivityLevel(activityLevel: string): string {
  const mapping: Record<string, string> = {
    'sedentary': 'sedentary',
    'light': 'lightly_active',
    'moderate': 'moderately_active',
    'active': 'very_active',
    'very_active': 'extremely_active'
  };
  
  return mapping[activityLevel.toLowerCase()] || 'sedentary';
}

/**
 * Setup initial goals based on user metrics
 * @param userId User ID
 * @param currentWeight Current weight
 * @param goalWeight Goal weight
 * @param dailyCalories Calculated daily calories
 * @param macros Calculated macronutrients
 */
async function setupInitialGoals(userId: string, currentWeight: number, goalWeight: number, dailyCalories: number, macros: { protein: number; carbs: number; fat: number }) {
  try {
    // Weight goal
    await goalRepository.create({
      user_id: userId,
      goal_type: 'weight',
      target_value: goalWeight,
      start_date: new Date(),
      target_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
      status: 'active',
      created_at: new Date(),
      updated_at: new Date()
    });
    
    // Calorie goal
    await goalRepository.create({
      user_id: userId,
      goal_type: 'calories',
      target_value: dailyCalories,
      start_date: new Date(),
      target_date: null, // Ongoing
      status: 'active',
      created_at: new Date(),
      updated_at: new Date()
    });
    
    // Protein goal
    await goalRepository.create({
      user_id: userId,
      goal_type: 'protein',
      target_value: macros.protein,
      start_date: new Date(),
      target_date: null, // Ongoing
      status: 'active',
      created_at: new Date(),
      updated_at: new Date()
    });
    
    // Carbs goal
    await goalRepository.create({
      user_id: userId,
      goal_type: 'carbs',
      target_value: macros.carbs,
      start_date: new Date(),
      target_date: null, // Ongoing
      status: 'active',
      created_at: new Date(),
      updated_at: new Date()
    });
    
    // Fat goal
    await goalRepository.create({
      user_id: userId,
      goal_type: 'fat',
      target_value: macros.fat,
      start_date: new Date(),
      target_date: null, // Ongoing
      status: 'active',
      created_at: new Date(),
      updated_at: new Date()
    });
    
    // Water goal (default 8 glasses)
    await goalRepository.create({
      user_id: userId,
      goal_type: 'water',
      target_value: 8,
      start_date: new Date(),
      target_date: null, // Ongoing
      status: 'active',
      created_at: new Date(),
      updated_at: new Date()
    });
  } catch (error) {
    console.error('Error setting up initial goals:', error);
    // Don't throw - we don't want to fail registration if goal setup fails
    // But log the error for monitoring
    AuditLogger.log('goal_setup_failed', { userId, error: (error as Error).message });
  }
}

router.post('/', async (req: Request, res: Response) => {
  console.log('register endpoint hit')
  try {
    AuditLogger.log('registration_attempt', { ip: req.ip, userAgent: req.headers['user-agent'] });
    
    // Handle both body and query parameters
    const data = req.body && Object.keys(req.body).length > 0 ? req.body : req.query as Record<string, unknown>;
    
    const {
      email,
      password,
      firstName,
      lastName,
      birthDateStr,
      gender,
      height,
      currentWeight,
      goalWeight,
      activityLevel,
      preferences,
      termsAccepted
    } = data;

    // Convert string values to appropriate types if coming from query params
    const processedData = {
      email,
      password,
      firstName,
      lastName,
      birthDate: birthDateStr,
      gender,
      height: typeof height === 'string' ? parseFloat(height) : height,
      currentWeight: typeof currentWeight === 'string' ? parseFloat(currentWeight) : currentWeight,
      goalWeight: typeof goalWeight === 'string' ? parseFloat(goalWeight) : goalWeight,
      activityLevel: mapActivityLevel(activityLevel),
      preferences: preferences && typeof preferences === 'string' ? 
        (preferences === '' ? {} : JSON.parse(preferences)) : preferences,
      termsAccepted: typeof termsAccepted === 'string' ? 
        termsAccepted === 'true' : termsAccepted
    };

    // Parse birthDate properly - handle DD-MM-YYYY format
    if (processedData.birthDate && typeof processedData.birthDate === 'string') {
      const dateParts = processedData.birthDate.split('-');
      if (dateParts.length === 3) {
        // If format is DD-MM-YYYY, convert to YYYY-MM-DD
        if (dateParts[0].length === 2 && dateParts[1].length === 2 && dateParts[2].length === 4) {
          processedData.birthDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
        }
      }
    }

    // Input validation
    const validationErrors = [];
    
    if (!validateEmail(processedData.email)) {
      validationErrors.push('Invalid email format');
    }

    if (!validatePassword(processedData.password)) {
      validationErrors.push('Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character');
    }

    if (!validatePersonalInfo(processedData.firstName, processedData.lastName, processedData.birthDate)) {
      validationErrors.push('Invalid personal information');
    }

    if (!validateHealthMetrics(processedData.height, processedData.currentWeight, processedData.goalWeight)) {
      validationErrors.push('Health metrics must be positive numbers');
    }
    
    if (!validateActivityLevel(processedData.activityLevel)) {
      validationErrors.push('Invalid activity level');
    }

    if (!validateTermsAccepted(processedData.termsAccepted)) {
      validationErrors.push('Terms must be accepted to register');
    }
    
    if (!validatePreferences(processedData.preferences)) {
      validationErrors.push('Invalid preferences format');
    }
    
    if (validationErrors.length > 0) {
      AuditLogger.log('registration_validation_failed', { 
        email: processedData.email, 
        errors: validationErrors 
      });
      res.status(400).json({ errors: validationErrors });
      return;
    }

    // Check for existing user
    console.log('Checking for existing user with email:', processedData.email);
    const existingUser = await userRepository.findByEmail(processedData.email, false); // Disable cache for this check
    console.log('Existing user result:', existingUser);
    if (existingUser) {
      AuditLogger.log('registration_duplicate_email', { email: processedData.email });
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    // Hash password
    const password_hash = await bcrypt.hash(processedData.password, 12);

    // Create new user
    const userId = uuidv4();
    const user = await userRepository.create({
      id: userId,
      email: processedData.email,
      password_hash: password_hash, // Use password_hash directly, not hashedPassword
      first_name: processedData.firstName,
      last_name: processedData.lastName,
      birth_date: processedData.birthDate,
      gender: processedData.gender,
      height: processedData.height,
      current_weight: processedData.currentWeight,
      goal_weight: processedData.goalWeight,
      activity_level: processedData.activityLevel,
      preferences: processedData.preferences || {},
      created_at: new Date(),
      updated_at: new Date(),
      emailVerified: false
    });

    // Log terms acceptance separately
    if (processedData.termsAccepted) {
      logTermsAcceptance(userId, new Date());
    }

    // Calculate age from birthDate
    const birthDate = new Date(processedData.birthDate);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    // Calculate BMR and daily calorie needs
    const bmr = calculateBMR(
      processedData.gender, 
      processedData.currentWeight, 
      processedData.height, 
      age
    );
    
    const dailyCalories = calculateDailyCalories(bmr, processedData.activityLevel);
    const macros = calculateMacros(dailyCalories);

    // Setup initial goals and daily targets
    await setupInitialGoals(
      userId, 
      processedData.currentWeight, 
      processedData.goalWeight, 
      dailyCalories, 
      macros
    );

    // Log GDPR consent
    logConsent(userId, 'registration', new Date());
    logTermsAcceptance(userId, new Date());

    // Inside the registerRouter function, replace the verification token generation with:
    // Generate JWT verification token that expires in 24 hours
    const verificationToken = generateEmailVerificationToken(userId, processedData.email);
    
    // Update the user with token creation time
    // await userRepository.updateUser(userId, { emailTokenCreatedAt: new Date() });
    
    // Attempt to send verification email with better error handling
    console.log('Attempting to send verification email to:', processedData.email);
    const verificationEmailSent = await sendVerificationEmail(
      processedData.email, 
      processedData.firstName, 
      verificationToken
    );
    
    // Remove welcome email sending from here
    // The welcome email will be sent after verification
    
    // Log email results
    console.log('Email sending results:', {
      verificationEmail: verificationEmailSent
    });
    
    // Log successful registration
    AuditLogger.log('registration_successful', { 
      userId, 
      email: processedData.email,
      ip: req.ip,
      emailsSent: {
        verification: verificationEmailSent
      }
    });

    // Include email status in response
    res.status(201).json({
      user: minimizeData(user as any),
      dailyTargets: {
        calories: dailyCalories,
        protein: macros.protein,
        carbs: macros.carbs,
        fat: macros.fat
      },
      message: 'Registration successful. Please verify your email.',
      emailStatus: {
        verificationEmailSent
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    AuditLogger.log('registration_error', { 
      error: (err as Error).message,
      stack: (err as Error).stack
    });
    res.status(500).json({ error: 'Registration failed due to server error' });
  }
});

export default router;
