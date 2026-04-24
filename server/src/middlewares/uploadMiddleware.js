import multer from 'multer';

const storage = multer.memoryStorage();

const imageFileFilter = (req, file, cb) => {
	if (!file.mimetype.startsWith('image/')) {
		const error = new Error('Only image files are allowed');
		error.statusCode = 400;
		cb(error);
		return;
	}

	cb(null, true);
};

const upload = multer({
	storage,
	limits: {
		fileSize: 5 * 1024 * 1024,
	},
	fileFilter: imageFileFilter,
});

export const uploadCampaignImage = upload.single('image');

const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
  fileFilter,
});

export const uploadSingleImage = upload.single('image');
export default upload;
