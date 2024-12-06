const Book = require('../Models/Book');
const fs = require('fs');

exports.getAllBooks = (req, res, next) => {
    Book.find().select('title author imageUrl ratings averageRating userId')
        .then(books => res.status(200).json(books))
        .catch(error => res.status(400).json({ error }));
};

exports.getOneBook = (req, res, next) => {
    Book.findOne({ _id: req.params.id })
        .select('title author imageUrl ratings averageRating userId')
        .then(book => {
            if (book) {
                const bookData = book.toObject();
                bookData.userConnected = !!req.auth;
                if (req.auth) {
                    bookData.currentUserId = req.auth.userId;
                    bookData.userRated = book.ratings.some(rating => rating.userId === req.auth.userId);
                } else {
                    bookData.currentUserId = null;
                    bookData.userRated = false;
                }
                res.status(200).json(bookData);
            } else {
                res.status(404).json({ message: 'Livre non trouvé' });
            }
        })
        .catch(error => res.status(404).json({ error }));
};

exports.createBook = (req, res, next) => {
    const bookObject = JSON.parse(req.body.book);
    delete bookObject._id;
    delete bookObject._userId;

    const book = new Book({
        ...bookObject,
        userId: req.auth.userId,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
        ratings: [],
        averageRating: 0
    });

    book.save()
        .then(savedBook => {
            return Book.findById(savedBook._id).select('title author imageUrl ratings averageRating userId');
        })
        .then(book => {
            const bookData = book.toObject();
            bookData.userConnected = true;
            bookData.currentUserId = req.auth.userId;
            bookData.userRated = false;
            res.status(201).json({ message: 'Livre Ajouté avec succès !', book: bookData });
        })
        .catch(error => res.status(400).json({ error }));
};

exports.rateBook = (req, res, next) => {
    if (!req.auth) {
        return res.status(401).json({ message: 'Non autorisé' });
    }

    Book.findOne({ _id: req.params.id })
        .then((book) => {
            if (!book) {
                return res.status(404).json({ message: 'Livre non trouvé' });
            }

            const userRatingIndex = book.ratings.findIndex(rating => rating.userId === req.auth.userId);

            if (userRatingIndex !== -1) {
                return res.status(400).json({ message: "Vous avez déjà noté ce livre" });
            }

            const grade = Math.max(0, Math.min(5, req.body.rating));
            book.ratings.push({ grade: grade, userId: req.auth.userId });

            const sumTotal = book.ratings.reduce((acc, rating) => acc + rating.grade, 0);
            book.averageRating = Math.round((sumTotal / book.ratings.length) * 100) / 100;

            return book.save();
        })
        .then(updatedBook => {
            return Book.findById(updatedBook._id).select('title author imageUrl ratings averageRating userId');
        })
        .then(book => {
            const bookData = book.toObject();
            bookData.userConnected = true;
            bookData.currentUserId = req.auth.userId;
            bookData.userRated = true;
            res.status(200).json(bookData);
        })
        .catch(error => res.status(400).json({ error }));
};

exports.deleteBook = (req, res, next) => {
    Book.findOne({ _id: req.params.id })
        .then(book => {
            if (book.userId != req.auth.userId) {
                res.status(403).json({ message: 'Non autorisé' });
            } else {
                const filename = book.imageUrl.split('/images/')[1];
                fs.unlink(`images/${filename}`, () => {
                    Book.deleteOne({ _id: req.params.id })
                        .then(() => { res.status(200).json({ message: 'Livre Supprimé!' }) })
                        .catch(error => res.status(400).json({ error }));
                });
            }
        })
        .catch(error => {
            res.status(500).json({ error });
        });
};

exports.modifyBook = (req, res, next) => {
    const bookObject = req.file ? {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : { ...req.body };

    delete bookObject._userId;

    Book.findOne({ _id: req.params.id })
        .then((book) => {
            if (book.userId != req.auth.userId) {
                res.status(403).json({ message: 'Non autorisé' });
            } else {
                if (req.file && book.imageUrl) {
                    const filename = book.imageUrl.split('/images/')[1];
                    fs.unlink(`images/${filename}`, (err) => {
                        if (err) console.error('Failed to delete old image:', err);
                    });
                }

                return Book.findByIdAndUpdate(req.params.id, { ...bookObject, _id: req.params.id }, { new: true })
                    .select('title author imageUrl ratings averageRating userId');
            }
        })
        .then(updatedBook => {
            if (updatedBook) {
                const bookData = updatedBook.toObject();
                bookData.userConnected = true;
                bookData.currentUserId = req.auth.userId;
                bookData.userRated = updatedBook.ratings.some(rating => rating.userId === req.auth.userId);
                res.status(200).json(bookData);
            }
        })
        .catch((error) => {
            res.status(400).json({ error });
        });
};

exports.bestRating = (req, res, next) => {
    Book.find().sort('-averageRating').limit(3)
        .then(books => {
            const booksData = books.map(book => {
                const bookData = book.toObject();
                bookData.userConnected = !!req.auth;
                if (req.auth) {
                    bookData.currentUserId = req.auth.userId;
                    bookData.userRated = book.ratings.some(rating => rating.userId === req.auth.userId);
                } else {
                    bookData.currentUserId = null;
                    bookData.userRated = false;
                }
                return bookData;
            });
            res.status(200).json(booksData);
        })
        .catch(error => res.status(500).json({ error }));
};

