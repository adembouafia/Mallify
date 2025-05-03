const auth = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/authorize.middleware");
const multer = require("multer");


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    },
});
const upload = multer({ storage: storage });

module.exports = (app) => {
    const moderator = require("../controllers/moderator.controller");
    app.post('/moderator/register', auth ,authorize('vendor'), moderator.addModerator);
    app.post('/moderator/login', moderator.login);
    app.post('/moderator/forgotPassword', moderator.forgotPassword);
    app.post('/moderator/reset-password', moderator.resetPassword);
    app.get('/moderator/shop', auth, authorize('vendor'), moderator.getModeratorByShop);
    app.put('/moderator/update/:id', auth, authorize('moderator', 'vendor'), upload.single("moderatorImage"), moderator.updateModerator);
    app.delete('/moderator/delete/:id', auth, authorize('moderator', 'vendor'), moderator.deleteModerator);
};