/**
 * @openapi
 * /api/exercise/library:
 *   get:
 *     summary: Get exercise library
 *     tags:
 *       - Exercise
 *     responses:
 *       200:
 *         description: List of exercises
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Exercise'
 */

/**
 * @openapi
 * /api/exercise/log:
 *   post:
 *     summary: Log an exercise
 *     tags:
 *       - Exercise
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ExerciseLog'
 *     responses:
 *       201:
 *         description: Exercise logged
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */ 