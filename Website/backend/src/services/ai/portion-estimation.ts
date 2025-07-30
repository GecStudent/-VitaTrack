import { getCache, setCache } from '../../database/cache/redisCache';

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PortionEstimate {
  estimatedGrams: number;
  estimatedUnit: string;
  confidence: number;
}

class PortionEstimation {
  private readonly CACHE_TTL = 86400; // 24 hours cache
  
  // Reference sizes for common food items in grams
  private readonly REFERENCE_SIZES: Record<string, { defaultGrams: number; defaultUnit: string }> = {
    apple: { defaultGrams: 182, defaultUnit: 'medium' },
    banana: { defaultGrams: 118, defaultUnit: 'medium' },
    orange: { defaultGrams: 131, defaultUnit: 'medium' },
    bread: { defaultGrams: 30, defaultUnit: 'slice' },
    rice: { defaultGrams: 158, defaultUnit: 'cup' },
    pasta: { defaultGrams: 140, defaultUnit: 'cup' },
    chicken: { defaultGrams: 85, defaultUnit: 'piece' },
    beef: { defaultGrams: 85, defaultUnit: 'serving' },
    fish: { defaultGrams: 85, defaultUnit: 'fillet' },
    egg: { defaultGrams: 50, defaultUnit: 'large' },
    potato: { defaultGrams: 173, defaultUnit: 'medium' },
    carrot: { defaultGrams: 61, defaultUnit: 'medium' },
    broccoli: { defaultGrams: 91, defaultUnit: 'cup' },
    salad: { defaultGrams: 36, defaultUnit: 'cup' },
    pizza: { defaultGrams: 107, defaultUnit: 'slice' },
    burger: { defaultGrams: 240, defaultUnit: 'regular' },
    fries: { defaultGrams: 117, defaultUnit: 'medium' },
    cookie: { defaultGrams: 30, defaultUnit: 'medium' },
    cake: { defaultGrams: 80, defaultUnit: 'slice' },
    ice_cream: { defaultGrams: 66, defaultUnit: 'scoop' }
  };
  
  /**
   * Estimate portion size from image
   */
  async estimatePortionSize(
    imagePath: string,
    boundingBox: BoundingBox,
    foodLabel: string
  ): Promise<PortionEstimate> {
    // Create cache key
    const cacheKey = `portion-estimate:${imagePath}:${JSON.stringify(boundingBox)}:${foodLabel}`;
    
    // Try to get from cache
    const cachedResult = await getCache(cacheKey);
    if (cachedResult && typeof cachedResult === 'object' && 'estimatedGrams' in cachedResult && 'estimatedUnit' in cachedResult && 'confidence' in cachedResult) {
      return cachedResult as PortionEstimate;
    }
    return { estimatedGrams: 0, estimatedUnit: '', confidence: 0 };
    
    // Get reference size for this food type
    const normalizedLabel = this.normalizeLabel(foodLabel);
    const referenceSize = this.findReferenceSizeForFood(normalizedLabel);
    
    // Calculate portion size based on object size in image
    // This is a simplified approach - in a real system, we would use depth estimation,
    // reference objects, or more sophisticated computer vision techniques
    const objectArea = boundingBox.width * boundingBox.height;
    const imageArea = 1; // Normalized image area
    
    // Adjust portion based on relative size in image
    // This is a very simplified approach
    const relativeSizeFactor = Math.sqrt(objectArea / imageArea);
    const estimatedGrams = Math.round(referenceSize.defaultGrams * relativeSizeFactor);
    
    // Determine confidence based on how well we know this food type
    let confidence = 0.7; // Default medium confidence
    if (this.REFERENCE_SIZES[normalizedLabel]) {
      confidence = 0.9; // Higher confidence for known foods
    }
    
    const result: PortionEstimate = {
      estimatedGrams,
      estimatedUnit: referenceSize.defaultUnit,
      confidence
    };
    
    // Cache result
    await setCache(cacheKey, result, this.CACHE_TTL);
    
    return result;
  }
  
  /**
   * Normalize food label for lookup
   */
  private normalizeLabel(label: string): string {
    return label.toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
  }
  
  /**
   * Find reference size for a food item
   */
  private findReferenceSizeForFood(normalizedLabel: string): { defaultGrams: number; defaultUnit: string } {
    // Direct match
    if (this.REFERENCE_SIZES[normalizedLabel]) {
      return this.REFERENCE_SIZES[normalizedLabel];
    }
    
    // Partial match
    for (const [key, value] of Object.entries(this.REFERENCE_SIZES)) {
      if (normalizedLabel.includes(key) || key.includes(normalizedLabel)) {
        return value;
      }
    }
    
    // Default fallback
    return { defaultGrams: 100, defaultUnit: 'serving' };
  }
  
  /**
   * Update reference sizes with new data
   */
  async updateReferenceSize(foodLabel: string, grams: number, unit: string): Promise<void> {
    const normalizedLabel = this.normalizeLabel(foodLabel);
    this.REFERENCE_SIZES[normalizedLabel] = { defaultGrams: grams, defaultUnit: unit };
    
    // In a real implementation, we would persist this to a database
  }
}

export const portionEstimation = new PortionEstimation();