const fs = require('fs');
let code = fs.readFileSync('backend/routes/orders.js', 'utf8');

const middlewareStr = `const checkMaintenance = async (req, res, next) => {
  const settings = await Settings.findOne();
  if (settings && settings.maintenanceMode) {
    return res.status(403).json({ success: false, message: settings.maintenanceMessage || 'Purchasing is temporarily disabled.' });
  }
  next();
};`;

if (!code.includes('checkMaintenance')) {
    code = code.replace("const upload = require('../middleware/upload');", "const upload = require('../middleware/upload');\n\n" + middlewareStr);
}

code = code.replace("router.post('/create', optionalAuth, async (req, res) => {", "router.post('/create', optionalAuth, checkMaintenance, async (req, res) => {");
code = code.replace("router.post('/stripe', optionalAuth, async (req, res) => {", "router.post('/stripe', optionalAuth, checkMaintenance, async (req, res) => {");
code = code.replace("router.post('/razorpay', optionalAuth, async (req, res) => {", "router.post('/razorpay', optionalAuth, checkMaintenance, async (req, res) => {");

fs.writeFileSync('backend/routes/orders.js', code);
console.log('Fixed backend/routes/orders.js');
