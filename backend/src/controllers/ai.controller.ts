import { Request, Response, NextFunction } from 'express';
import { assistDescription, aiEnabled, suggestCategoryFromImage } from '../services/ai';
import { badRequest } from '../utils/errors';
import { textAssistSchema } from '../validators/schemas';

/**
 * Optional AI endpoints. They never block complaint submission and always return
 * a clearly labelled `source` so the UI can distinguish AI from fallback results.
 */
export async function analyzeImage(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) throw badRequest('Attach an image to analyse');
    const result = await suggestCategoryFromImage(req.file.buffer, req.file.mimetype, req.file.originalname);
    res.json({ ...result, aiEnabled: aiEnabled() });
  } catch (error) {
    next(error);
  }
}

export async function assistText(req: Request, res: Response, next: NextFunction) {
  try {
    const input = textAssistSchema.parse(req.body);
    const result = await assistDescription(input.text);
    res.json({ ...result, aiEnabled: aiEnabled() });
  } catch (error) {
    next(error);
  }
}
