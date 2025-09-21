const Relatorio = require('../models/relatorioModel');

exports.vendasPorPeriodo = async (req, res) => {
  try {
    let { inicio, fim } = req.query;

    // Se não veio periodo, pega últimos 30 dias
    if (!inicio || !fim) {
      const hoje = new Date();
      const trintaDias = new Date(hoje.getTime() - 29 * 24 * 60 * 60 * 1000);
      inicio = trintaDias.toISOString().slice(0, 10) + ' 00:00:00';
      fim = hoje.toISOString().slice(0, 10) + ' 23:59:59';
    } else {
      // normalizar formato recebido (YYYY-MM-DD -> add time)
      if (inicio.length === 10) inicio = inicio + ' 00:00:00';
      if (fim.length === 10) fim = fim + ' 23:59:59';
    }

    const dados = await Relatorio.vendasPorPeriodo(inicio, fim);
    // retornar JSON já pronto para front
    res.json({ inicio, fim, resultado: dados });
  } catch (err) {
    console.error('Erro gerar relatório vendasPorPeriodo:', err);
    res.status(500).json({ error: 'Erro ao gerar relatório' });
  }
};

exports.pedidosPorCliente = async (req, res) => {
  try {
    const clienteId = req.params.clienteId;
    const dados = await Relatorio.pedidosPorCliente(clienteId);
    res.json({ clienteId, pedidos: dados });
  } catch (err) {
    console.error('Erro gerar relatório pedidosPorCliente:', err);
    res.status(500).json({ error: 'Erro ao gerar relatório' });
  }
};
