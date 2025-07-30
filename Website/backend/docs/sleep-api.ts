/**
 * @openapi
 * /api/sleep/logs:
 *   get:
 *     summary: Get sleep logs
 *     tags:
 *       - Sleep
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of sleep logs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SleepLog'
 */

/**
 * @openapi
 * /api/sleep/logs:
 *   post:
 *     summary: Log sleep
 *     tags:
 *       - Sleep
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SleepLogCreate'
 *     responses:
 *       201:
 *         description: Sleep log created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */ 