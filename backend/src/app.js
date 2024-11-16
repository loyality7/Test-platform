import { authenticateToken } from './middleware/auth.middleware.js';

app.use('/api', authenticateToken); 