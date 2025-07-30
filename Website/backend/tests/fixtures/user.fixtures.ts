export const userFixtures = {
  validUser: {
    email: 'test@example.com',
    password: 'Password123!',
    firstName: 'Test',
    lastName: 'User',
    dateOfBirth: '1990-01-01',
    gender: 'other',
    height: 175,
    weight: 70,
    activityLevel: 'moderate'
  },
  validLoginCredentials: {
    email: 'test@example.com',
    password: 'Password123!'
  },
  invalidLoginCredentials: {
    email: 'test@example.com',
    password: 'wrongpassword'
  }
};