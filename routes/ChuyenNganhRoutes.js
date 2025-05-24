// routes/chuyenNganhRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('./controllers/chuyenNganhController');

router.post('/save', controller.save);

module.exports = router;