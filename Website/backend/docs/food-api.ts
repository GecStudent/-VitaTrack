/**
 * @openapi
 * /api/food/search:
 *   get:
 *     summary: Search for foods
 *     tags:
 *       - Food
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         required: true
 *         description: Search query for food items
 *     responses:
 *       200:
 *         description: List of matching foods
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Food'
 */

/**
 * @openapi
 * /api/food/barcode:
 *   get:
 *     summary: Lookup food by barcode
 *     tags:
 *       - Food
 *     parameters:
 *       - in: query
 *         name: barcode
 *         schema:
 *           type: string
 *         required: true
 *         description: Barcode value
 *     responses:
 *       200:
 *         description: Food item details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Food'
 */ 