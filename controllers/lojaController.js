const db = require('../config/database');

// Página inicial da loja → categorias
exports.categorias = (req, res) => {
  db.query('SELECT * FROM categoria_produto', (err, categorias) => {
    if (err) return res.send('Erro ao carregar categorias');
    res.render('loja/categorias', { categorias, session: req.session });
  });
};

// Lista produtos de uma categoria
exports.produtosPorCategoria = (req, res) => {
  const categoriaId = req.params.id;

  const sql = `
    SELECT p.*, c.nome AS categoria_nome
    FROM produtos p
    JOIN categoria_produto c ON p.categoria_id = c.id
    WHERE p.categoria_id = ?
  `;

  db.query(sql, [categoriaId], (err, produtos) => {
    if (err) return res.send('Erro ao carregar produtos');

    const produtosFormatados = produtos.map(p => ({
      ...p,
      preco: Number(p.preco)
    }));

    res.render('loja/produtos', {
      produtos: produtosFormatados,
      categoriaNome: produtos[0] ? produtos[0].categoria_nome : 'Categoria',
      session: req.session
    });
  });
};

// Detalhes de um produto
exports.detalhesProduto = (req, res) => {
  const produtoId = req.params.id;

  const sql = `
    SELECT p.*, c.nome AS categoria_nome
    FROM produtos p
    JOIN categoria_produto c ON p.categoria_id = c.id
    WHERE p.id = ?
  `;

  db.query(sql, [produtoId], (err, resultados) => {
    if (err || resultados.length === 0) return res.send('Produto não encontrado');

    const produto = {
      ...resultados[0],
      preco: Number(resultados[0].preco)
    };

    res.render('loja/detalhes', { produto, session: req.session });
  });
};

// Exibe o carrinho
exports.verCarrinho = (req, res) => {
  const carrinho = req.session.carrinho || [];
  res.render('loja/carrinho', { carrinho, session: req.session });
};

// Adiciona produto ao carrinho
exports.adicionarAoCarrinho = (req, res) => {
  const { produtoId, nome, preco, quantidade } = req.body;

  if (!req.session.carrinho) {
    req.session.carrinho = [];
  }

  const existente = req.session.carrinho.find(p => p.produtoId == produtoId);
  if (existente) {
    existente.quantidade += parseInt(quantidade);
  } else {
    req.session.carrinho.push({
      produtoId,
      nome,
      preco: parseFloat(preco),
      quantidade: parseInt(quantidade)
    });
  }

  res.redirect('/loja/carrinho');
};

// Remove item do carrinho
exports.removerDoCarrinho = (req, res) => {
  const { produtoId } = req.body;

  if (!req.session.carrinho) {
    req.session.carrinho = [];
  }

  req.session.carrinho = req.session.carrinho.filter(p => p.produtoId != produtoId);

  res.redirect('/loja/carrinho');
};

// Atualiza quantidade de item do carrinho
exports.atualizarCarrinho = (req, res) => {
  const { produtoId, quantidade } = req.body;

  if (!req.session.carrinho) {
    req.session.carrinho = [];
  }

  const item = req.session.carrinho.find(p => p.produtoId == produtoId);
  if (item) {
    item.quantidade = parseInt(quantidade);
  }

  res.redirect('/loja/carrinho');
};

// Exibe página de checkout
exports.checkout = (req, res) => {
  const carrinho = req.session.carrinho || [];

  if (carrinho.length === 0) {
    return res.redirect('/loja/carrinho');
  }

  const usuario = req.session.usuario; // dados do cliente logado

  res.render('loja/checkout', {
    carrinho,
    usuario,
    session: req.session
  });
};

// Finaliza o pedido e salva no banco
exports.finalizarPedido = (req, res) => {
  const { forma_pagamento } = req.body;
  const carrinho = req.session.carrinho || [];
  const usuario = req.session.usuario;

  if (!usuario) {
    return res.redirect('/login'); // força login se não tiver usuário
  }

  if (carrinho.length === 0) {
    return res.redirect('/loja/carrinho');
  }

  // Insere pedido na tabela pedidos
  const sqlPedido = `
    INSERT INTO pedidos (usuario_id, data_pedido, status_pedido_id, status_pagamento_id, forma_pagamento_id)
    VALUES (?, NOW(), 1, 1, ?) -- 1 = pedido em andamento, 1 = pagamento pendente
  `;

  db.query(sqlPedido, [usuario.id, forma_pagamento], (err, resultado) => {
    if (err) {
      console.error("Erro ao salvar pedido:", err);
      return res.send('Erro ao salvar pedido');
    }

    const pedidoId = resultado.insertId;

    // Insere itens do pedido
    const sqlItens = `
      INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_unitario)
      VALUES ?
    `;

    const valores = carrinho.map(p => [
      pedidoId,
      p.produtoId,
      p.quantidade,
      p.preco
    ]);

    db.query(sqlItens, [valores], (err2) => {
      if (err2) {
        console.error("Erro ao salvar itens:", err2);
        return res.send('Erro ao salvar itens');
      }

      // Limpa carrinho da sessão
      req.session.carrinho = [];

      res.redirect('/loja/pedidos');
    });
  });
};

// Lista pedidos do cliente logado
exports.meusPedidos = (req, res) => {
  const usuario = req.session.usuario;
  if (!usuario) {
    return res.redirect('/login');
  }

  const sql = `
    SELECT p.id, p.data_pedido, 
           sp.descricao AS status_pedido, 
           spg.descricao AS status_pagamento,
           f.descricao AS forma_pagamento
    FROM pedidos p
    JOIN status_pedido sp ON p.status_pedido_id = sp.id
    JOIN status_pagamento spg ON p.status_pagamento_id = spg.id
    JOIN forma_pagamento f ON p.forma_pagamento_id = f.id
    WHERE p.usuario_id = ?
    ORDER BY p.data_pedido DESC
  `;

  db.query(sql, [usuario.id], (err, pedidos) => {
    if (err) {
      console.error("Erro ao carregar pedidos:", err);
      return res.send('Erro ao carregar pedidos');
    }
    res.render('loja/pedidos', { pedidos, session: req.session });
  });
};
