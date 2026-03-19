const b = require('bcryptjs');
b.hash('admin123', 10).then(h => console.log(h));
