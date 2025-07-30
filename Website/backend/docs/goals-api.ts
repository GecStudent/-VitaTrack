/**
 * @openapi
 * /api/goals:
 *   get:
 *     summary: Get user goals
 *     tags:
 *       - Goals
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user goals
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Goal'
 */

/**
 * @openapi
 * /api/goals:
 *   post:
 *     summary: Create a new goal
 *     tags:
 *       - Goals
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GoalCreate'
 *     responses:
 *       201:
 *         description: Goal created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */ 