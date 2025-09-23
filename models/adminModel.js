const db = require('../config/database');

exports.getAdminByEmail = (email, callback) => {
  db.query('SELECT * FROM admin WHERE email = ?', [email], callback);
};
