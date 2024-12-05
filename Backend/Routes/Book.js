const express = require('express');
const multer = require('../Middleware/Multer-config');
const router = express.Router();
const auth= require('../Middleware/Auth')
const bookCtrl = require('../Controllers/Book');

router.get('/', bookCtrl.getAllBooks);
router.post('/', auth, multer, bookCtrl.createBook);
//router.post('/:id/rating', auth, bookCtrl.rateBook);
router.get('/bestrating', bookCtrl.bestRating);
router.get('/:id',bookCtrl.getOneBook);
//router.put('/:id', auth, multer, bookCtrl.modifyBook);
router.delete('/:id', auth, bookCtrl.deleteBook);

module.exports = router;