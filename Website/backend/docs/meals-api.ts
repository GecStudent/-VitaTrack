/**
 * @openapi
 * /api/meals:
 *   get:
 *     summary: Get meal logs
 *     tags:
 *       - Meals
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of meal logs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/MealLog'
 */

/**
 * @openapi
 * /api/meals:
 *   post:
 *     summary: Log a meal
 *     tags:
 *       - Meals
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MealLogCreate'
 *     responses:
 *       201:
 *         description: Meal logged
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */ 