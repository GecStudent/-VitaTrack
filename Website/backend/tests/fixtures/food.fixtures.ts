export const foodFixtures = {
  validFood: {
    name: 'Test Food',
    brand: 'Test Brand',
    description: 'A test food item',
    categories: ['test', 'food'],
    nutrition_per_100g: {
      calories: 100,
      protein: 10,
      carbohydrates: 20,
      fat: 5,
      fiber: 2,
      sugar: 5,
      sodium: 100
    },
    verified: true
  },
  validFoods: [
    {
      name: 'Apple',
      brand: 'Nature',
      description: 'Fresh apple',
      categories: ['fruit', 'fresh'],
      nutrition_per_100g: {
        calories: 52,
        protein: 0.3,
        carbohydrates: 14,
        fat: 0.2,
        fiber: 2.4,
        sugar: 10.4,
        sodium: 1
      },
      verified: true
    },
    {
      name: 'Banana',
      brand: 'Nature',
      description: 'Fresh banana',
      categories: ['fruit', 'fresh'],
      nutrition_per_100g: {
        calories: 89,
        protein: 1.1,
        carbohydrates: 22.8,
        fat: 0.3,
        fiber: 2.6,
        sugar: 12.2,
        sodium: 1
      },
      verified: true
    }
  ]
};