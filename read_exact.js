const fs = require('fs');
const file = "c:\\Users\\ADMIN\\Thaarai-Ecommerce-UI\\admin\\src\\pages\\Orders.jsx"; // <--- fixed escape
const lines = fs.readFileSync(file, 'utf8').split('\n');
console.log(JSON.stringify(lines.slice(200, 210), null, 2));
