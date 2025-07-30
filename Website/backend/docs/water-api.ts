/**
 * @openapi
 * /api/water/logs:
 *   get:
 *     summary: Get water logs
 *     tags:
 *       - Water
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of water logs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/WaterLog'
 */

/**
 * @openapi
 * /api/water/logs:
 *   post:
 *     summary: Log water intake
 *     tags:
 *       - Water
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WaterLogCreate'
 *     responses:
 *       201:
 *         description: Water log created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */ 