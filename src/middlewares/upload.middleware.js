const multer = require('multer');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Custom Multer Storage Engine for Cloudinary v2
const storage = {
    _handleFile: function (req, file, cb) {
        const userId = req.user ? req.user.id : 'anonymous';
        const timestamp = Date.now();
        const publicId = `${userId}_${timestamp}`;

        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'turf_avatars',
                public_id: publicId,
                resource_type: 'image',
                allowed_formats: ['jpg', 'jpeg', 'png']
            },
            (error, result) => {
                if (error) {
                    return cb(error);
                }
                // Store Cloudinary result in file object for later use
                file.cloudinary = result;
                cb(null, {
                    fieldname: file.fieldname,
                    originalname: file.originalname,
                    encoding: file.encoding,
                    mimetype: file.mimetype,
                    size: result.bytes,
                    path: result.secure_url, // Cloudinary URL (compatible with multer-storage-cloudinary)
                    url: result.secure_url,
                    public_id: result.public_id
                });
            }
        );

        // Pipe the file stream directly to Cloudinary
        file.stream.pipe(uploadStream);
    },
    _removeFile: function (req, file, cb) {
        // Optional: Delete from Cloudinary if needed
        if (file.public_id) {
            cloudinary.uploader.destroy(file.public_id, cb);
        } else {
            cb(null);
        }
    }
};

// File filter for image validation
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Accept image files ONLY!'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB
    },
    fileFilter: fileFilter
});

module.exports = upload;
