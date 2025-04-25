const auth = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/authorize.middleware");

module.exports = (app) => {
    const invoice = require("../controllers/invoice.controller");
    app.get('/invoice', auth, authorize('vendor', 'moderator'), invoice.getAllInvoices);
    app.get('/invoice/:id', auth, authorize('vendor', 'moderator', 'client'), invoice.getInvoiceById);
    app.get('/invoice/order/:orderId', auth, authorize('vendor', 'moderator'), invoice.getInvoiceByOrder);
};
