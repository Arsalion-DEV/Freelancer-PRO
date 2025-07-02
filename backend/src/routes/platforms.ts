import { Router } from 'express';
import { AuthenticatedRequest } from '@/controllers/platformController';
import { 
  getPlatformStatuses,
  getPlatformStatus,
  connectPlatform,
  disconnectPlatform,
  getUserConnections,
  getPlatformContent,
  getPlatformAnalytics,
  searchPlatformContent
} from '@/controllers/platformController';

const router = Router();

// Get all available platforms and their status
router.get('/', getPlatformStatuses);

// Get specific platform status
router.get('/:platform/status', getPlatformStatus);

// Connect to a platform
router.post('/:platform/connect', connectPlatform);

// Disconnect from a platform  
router.delete('/:platform/disconnect', disconnectPlatform);

// Sync data from a platform
router.get('/connections', getUserConnections);

// Get content from a platform
router.get('/:platform/content', getPlatformContent);

// Get platform metrics
router.get('/:platform/analytics', getPlatformAnalytics);

// Test platform connection
router.get('/:platform/search', searchPlatformContent);

export default router;