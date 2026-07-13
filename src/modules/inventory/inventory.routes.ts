import { Router } from 'express';
import { InventoryController } from './inventory.controller';
import { validate } from '../../middleware/validate';
import { adjustStockSchema, transferStockSchema } from './inventory.validation';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', InventoryController.getStockLevels);
router.get('/:productId', InventoryController.getProductStock);
router.get('/:productId/history', InventoryController.getProductHistory);
router.post('/adjust', authorize('ADMIN', 'STAFF'), validate(adjustStockSchema), InventoryController.adjustStock);
router.post('/transfer', authorize('ADMIN', 'STAFF'), validate(transferStockSchema), InventoryController.transferStock);

export { router };