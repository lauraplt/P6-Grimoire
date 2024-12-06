const multer = require('multer');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Disable sharp cache
sharp.cache(false);

// Definition of MIME types
const MIME_TYPES = {
    'image/jpg': 'jpg',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp'
};

// Ensure the 'images' directory exists
const imagesDir = path.join(__dirname, '..', 'images');
if (!fs.existsSync(imagesDir)){
    fs.mkdirSync(imagesDir, { recursive: true });
}

// Configuring multer to manage image storage
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, imagesDir);
    },
    filename: (req, file, callback) => {
        const name = file.originalname.split(' ').join('_');
        const extension = MIME_TYPES[file.mimetype];
        callback(null, name + Date.now() + '.' + extension);
    }
});

// Middleware : optimize images
const optimizeImage = async (req, res, next) => {
    if (!req.file) return next();

    const originalImagePath = req.file.path;
    const ext = path.extname(originalImagePath).toLowerCase();
    const isWebP = ext === '.webp';
    let optimizedImageName, optimizedImagePath;

    try {
        if (isWebP) {
            optimizedImageName = path.basename(originalImagePath);
            optimizedImagePath = originalImagePath;
        } else {
            optimizedImageName = `optimized_${path.basename(originalImagePath, ext)}.webp`;
            optimizedImagePath = path.join(imagesDir, optimizedImageName);

            await sharp(originalImagePath)
                .resize({ fit: 'contain' })
                .webp({ quality: 80 })
                .toFile(optimizedImagePath);

            fs.unlink(originalImagePath, (error) => {
                if (error) {
                    console.error("Impossible de supprimer l'image originale :", error);
                }
            });
        }
        req.file.path = optimizedImagePath;
        req.file.filename = optimizedImageName;
        next();
    } catch (error) {
        console.error("Erreur lors de l'optimisation de l'image :", error);
        return next(error);
    }
};

// Middleware Multer : upload
const upload = multer({ storage }).single('image');

module.exports = {
    upload,
    optimizeImage,
};