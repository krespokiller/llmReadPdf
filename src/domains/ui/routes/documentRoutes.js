const express = require('express');
const multer = require('multer');
const DocumentController = require('../controllers/DocumentController');

const router = express.Router();
const documentController = new DocumentController();

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// Routes
router.get('/', documentController.serveUI.bind(documentController));
router.post('/upload', upload.single('document'), documentController.processDocument.bind(documentController));
router.get('/health', documentController.healthCheck.bind(documentController));

module.exports = router;
