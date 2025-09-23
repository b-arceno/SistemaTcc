const db = require('../config/database');

exports.getAll = (cb) => {
  const sql = `
    SELECT p.*, c.nome AS categoria_nome
    FROM produtos p
    LEFT JOIN categoria_produto c ON p.categoria_id = c.id
    ORDER BY p.id DESC
  `;
  db.query(sql, cb);
};

exports.getById = (id, cb) => db.query('SELECT * FROM produtos WHERE id=?', [id], cb);

exports.create = (produto, cb) => {
  const sql = `
    INSERT INTO produtos (nome, descricao, preco, categoria_id, imagem)
    VALUES (?, ?, ?, ?, ?)
  `;
  db.query(sql, [produto.nome, produto.descricao, produto.preco, produto.categoria_id, produto.imagem], cb);
};

exports.update = (id, produto, cb) => {
  const sql = `
    UPDATE produtos SET nome=?, descricao=?, preco=?, categoria_id=?, imagem=? WHERE id=?
  `;
  db.query(sql, [produto.nome, produto.descricao, produto.preco, produto.categoria_id, produto.imagem, id], cb);
};

exports.delete = (id, cb) => db.query('DELETE FROM produtos WHERE id=?', [id], cb);
