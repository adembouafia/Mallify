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
    const admin = require("../controllers/admin.controller");

    app.post('/admin/login', admin.login);
    app.post('/admin/forgotPassword', admin.forgotPassword);
    app.post('/admin/reset-password', admin.resetPassword);
    app.post('/admin/add', auth, authorize('superAdmin'), admin.addAdmin);
    app.get('/admin/getAll', auth, authorize('superAdmin'), admin.getAllAdmins);
    app.delete('/admin/delete/:id', auth, authorize('superAdmin'), admin.deleteAdmin);
    app.put('/admin/update/:id', auth, authorize('superAdmin' , 'admin'), upload.single("adminImage"), admin.updateAdmin);
};


