const db = require('../config/db');

exports.getAdminByEmail = (email, callback) => {
  db.query('SELECT * FROM admin WHERE email = ?', [email], callback);
};
