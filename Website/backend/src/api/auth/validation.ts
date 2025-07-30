// Email validation with comprehensive regex
export function validateEmail(email: string): boolean {
  if (!email) return false;
  // RFC 5322 compliant email regex
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}

// Password strength validation (min 8 chars, 1 upper, 1 lower, 1 number, 1 special)
export function validatePassword(password: string): boolean {
  if (!password) return false;
  
  // Check minimum length
  if (password.length < 8) return false;
  
  // Check for uppercase, lowercase, number, and special character
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  return hasUppercase && hasLowercase && hasNumber && hasSpecial;
}

// Personal info validation with detailed checks
export function validatePersonalInfo(firstName: string, lastName: string, birthDate: string): boolean {
  // Check if first name and last name are provided and not just whitespace
  if (!firstName || !firstName.trim() || !lastName || !lastName.trim()) return false;
  
  // Check if names are reasonable length
  if (firstName.length > 50 || lastName.length > 50) return false;
  
  // Check if birthDate is valid
  if (!birthDate) return false;
  
  const date = new Date(birthDate);
  if (isNaN(date.getTime())) return false;
  
  // Check if birthDate is in the past
  const now = new Date();
  if (date > now) return false;
  
  // Check if user is at least 13 years old (common minimum age for online services)
  const thirteenYearsAgo = new Date();
  thirteenYearsAgo.setFullYear(now.getFullYear() - 13);
  if (date > thirteenYearsAgo) return false;
  
  // Check if user is not unreasonably old (e.g., over 120 years)
  const maxAge = new Date();
  maxAge.setFullYear(now.getFullYear() - 120);
  if (date < maxAge) return false;
  
  return true;
}

// Health metrics validation with reasonable ranges
export function validateHealthMetrics(height: number, currentWeight: number, goalWeight: number): boolean {
  // Check if all values are provided and are numbers
  if (height === undefined || currentWeight === undefined || goalWeight === undefined) return false;
  if (isNaN(height) || isNaN(currentWeight) || isNaN(goalWeight)) return false;
  
  // Check if all values are positive
  if (height <= 0 || currentWeight <= 0 || goalWeight <= 0) return false;
  
  // Check if height is within reasonable range (30cm to 250cm)
  if (height < 30 || height > 250) return false;
  
  // Check if weights are within reasonable range (20kg to 500kg)
  if (currentWeight < 20 || currentWeight > 500) return false;
  if (goalWeight < 20 || goalWeight > 500) return false;
  
  // Check if goal weight is not too different from current weight (safety check)
  const weightDiff = Math.abs(currentWeight - goalWeight);
  if (weightDiff > currentWeight * 0.5) return false; // Goal weight shouldn't differ by more than 50%
  
  return true;
}

// Terms acceptance validation
export function validateTermsAccepted(accepted: boolean): boolean {
  return accepted === true;
}

// Preferences validation with type checking
export function validatePreferences(preferences: Record<string, unknown> | undefined): boolean {
  // If preferences is undefined, it's valid (will use defaults)
  if (preferences === undefined) return true;
  
  // If preferences is null, it's invalid
  if (preferences === null) return false;
  
  // If preferences is not an object, it's invalid
  if (typeof preferences !== 'object' || Array.isArray(preferences)) return false;
  
  // This is a loose validation - we allow additional keys
  // You could make this stricter by checking that all keys are in validKeys
  
  return true;
}

// Activity level validation with allowed values
export function validateActivityLevel(level: string): boolean {
  if (!level) return false;
  
  const allowed = ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active'];
  return allowed.includes(level.toLowerCase());
}

// Gender validation
export function validateGender(gender: string): boolean {
  if (!gender) return false;
  
  const allowed = ['male', 'female', 'other', 'prefer_not_to_say'];
  return allowed.includes(gender.toLowerCase());
}

// Full registration payload validation
export function validateRegistrationPayload(payload: Record<string, unknown>): boolean {
  if (!payload) return false;
  return (
    typeof payload.email === 'string' && validateEmail(payload.email) &&
    typeof payload.password === 'string' && validatePassword(payload.password) &&
    typeof payload.firstName === 'string' && typeof payload.lastName === 'string' && typeof payload.birthDate === 'string' && validatePersonalInfo(payload.firstName, payload.lastName, payload.birthDate) &&
    typeof payload.gender === 'string' && validateGender(payload.gender) &&
    typeof payload.height === 'number' && typeof payload.currentWeight === 'number' && typeof payload.goalWeight === 'number' && validateHealthMetrics(payload.height, payload.currentWeight, payload.goalWeight) &&
    typeof payload.termsAccepted === 'boolean' && validateTermsAccepted(payload.termsAccepted) &&
    typeof payload.activityLevel === 'string' && validateActivityLevel(payload.activityLevel) &&
    (payload.preferences === undefined || typeof payload.preferences === 'object') && validatePreferences(payload.preferences as Record<string, unknown> | undefined)
  );
}