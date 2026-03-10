using Dapper;
using SagitarioSys.Api.Data;
using SagitarioSys.Api.Models.Oficina;

namespace SagitarioSys.Api.Repositories.Oficina
{
    public class OrdemServicoRepository
    {
        private readonly IDbConnectionFactory _dbFactory;

        public OrdemServicoRepository(IDbConnectionFactory dbFactory)
        {
            _dbFactory = dbFactory;
        }

        public async Task<IEnumerable<OrdemServico>> ObterTodosAsync(Guid empresaId)
        {
            using var connection = _dbFactory.CreateConnection();
            var sql = @"
                       SELECT 
                           o.id,
                           o.empresaid,
                           o.clienteid,
                           o.veiculoid,
                           o.numeroos,
                           o.status,
                           o.relatocliente,
                           o.observacoesinternas,
                           o.valortotal,
                           o.dataabertura,
                           o.dataconclusao,
                           o.kmatual,
                           c.nome        AS nomecliente,
                           c.cpfcnpj     AS clientecpfcnpj,
                           (SELECT cc.contato FROM contatoscliente cc 
                            WHERE cc.clienteid = c.id 
                            ORDER BY cc.id 
                            LIMIT 1)     AS clientetelefone,
                           v.placa       AS placaveiculo,
                           v.modelo      AS modeloveiculo,
                           v.marca       AS marcaveiculo
                       FROM ordensservico o
                       INNER JOIN clientes c ON o.clienteid = c.id
                       INNER JOIN veiculos v ON o.veiculoid = v.id
                       WHERE o.empresaid = @EmpresaId
                       ORDER BY o.numeroos DESC;";

            return await connection.QueryAsync<OrdemServico>(sql, new { EmpresaId = empresaId });
        }

        public async Task<OrdemServico?> ObterPorIdAsync(Guid id, Guid empresaId)
        {
            using var connection = _dbFactory.CreateConnection();

            var sqlOS = @"
                        SELECT 
                            o.id,
                            o.empresaid,
                            o.clienteid,
                            o.veiculoid,
                            o.numeroos,
                            o.status,
                            o.relatocliente,
                            o.observacoesinternas,
                            o.valortotal,
                            o.dataabertura,
                            o.dataconclusao,
                            o.kmatual,
                            c.nome        AS nomecliente,
                            c.cpfcnpj     AS clientecpfcnpj,
                            (SELECT cc.contato FROM contatoscliente cc 
                             WHERE cc.clienteid = c.id 
                             ORDER BY cc.id 
                             LIMIT 1)     AS clientetelefone,
                            v.placa       AS placaveiculo,
                            v.modelo      AS modeloveiculo,
                            v.marca       AS marcaveiculo
                        FROM ordensservico o
                        INNER JOIN clientes c ON o.clienteid = c.id
                        INNER JOIN veiculos v ON o.veiculoid = v.id
                        WHERE o.id = @Id AND o.empresaid = @EmpresaId;";

            var os = await connection.QuerySingleOrDefaultAsync<OrdemServico>(sqlOS, new { Id = id, EmpresaId = empresaId });

            if (os != null)
            {
                var sqlItens = "SELECT * FROM ordemservicoitens WHERE ordemservicoid = @Id";
                os.Itens = (await connection.QueryAsync<OrdemServicoItem>(sqlItens, new { Id = id })).ToList();
            }

            return os;
        }


        public async Task<Guid> CriarAsync(OrdemServico os)
        {
            // Calcula o total da OS baseado nos itens antes de salvar
            if (os.Itens != null && os.Itens.Any())
            {
                foreach (var item in os.Itens)
                {
                    item.ValorTotal = item.Quantidade * item.ValorUnitario;
                }
                os.ValorTotal = os.Itens.Sum(i => i.ValorTotal);
            }
            else
            {
                os.ValorTotal = 0;
            }

            using var connection = _dbFactory.CreateConnection();
            connection.Open();
            using var transaction = connection.BeginTransaction();

            try
            {
                var sqlOS = @"
                    INSERT INTO OrdensServico (EmpresaId, ClienteId, VeiculoId, Status, RelatoCliente, ObservacoesInternas, ValorTotal, KmAtual) 
                    VALUES (@EmpresaId, @ClienteId, @VeiculoId, @Status, @RelatoCliente, @ObservacoesInternas, @ValorTotal, @KmAtual) 
                    RETURNING Id;";

                var id = await connection.QuerySingleAsync<Guid>(sqlOS, os, transaction);

                if (os.Itens != null && os.Itens.Any())
                {
                    var sqlItem = @"
                        INSERT INTO OrdemServicoItens (OrdemServicoId, PecaId, Tipo, Descricao, Quantidade, ValorUnitario, ValorTotal) 
                        VALUES (@OrdemServicoId, @PecaId, @Tipo, @Descricao, @Quantidade, @ValorUnitario, @ValorTotal);";

                    foreach (var item in os.Itens)
                    {
                        item.OrdemServicoId = id;
                        await connection.ExecuteAsync(sqlItem, item, transaction);

                        if (item.Tipo == "Peca" && item.PecaId != null)
                        {
                            await DeduzirEstoqueAgrupadoAsync(connection, transaction, os.EmpresaId, item.PecaId.Value, item.Quantidade);
                        }
                    }
                }

                transaction.Commit();
                return id;
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
        }

        public async Task<bool> AtualizarAsync(OrdemServico os)
        {
            // Recalcula o total
            if (os.Itens != null && os.Itens.Any())
            {
                foreach (var item in os.Itens)
                {
                    item.ValorTotal = item.Quantidade * item.ValorUnitario;
                }
                os.ValorTotal = os.Itens.Sum(i => i.ValorTotal);
            }
            else
            {
                os.ValorTotal = 0;
            }

            using var connection = _dbFactory.CreateConnection();
            connection.Open();
            using var transaction = connection.BeginTransaction();

            try
            {
                var sqlOS = @"
                    UPDATE OrdensServico 
                    SET ClienteId = @ClienteId, VeiculoId = @VeiculoId, Status = @Status, 
                        RelatoCliente = @RelatoCliente, ObservacoesInternas = @ObservacoesInternas, 
                        ValorTotal = @ValorTotal, DataConclusao = @DataConclusao, KmAtual = @KmAtual
                    WHERE Id = @Id AND EmpresaId = @EmpresaId;";

                var linhas = await connection.ExecuteAsync(sqlOS, os, transaction);

                if (linhas > 0)
                {
                    // MÁGICA 2: Estorna (devolve) o estoque dos itens ANTIGOS antes de apagar
                    var oldItens = await connection.QueryAsync<OrdemServicoItem>("SELECT PecaId, Quantidade FROM OrdemServicoItens WHERE OrdemServicoId = @Id AND Tipo = 'Peca' AND PecaId IS NOT NULL", new { os.Id }, transaction);
                    foreach (var old in oldItens)
                    {
                        await connection.ExecuteAsync("UPDATE EstoquePecas SET Quantidade = Quantidade + @Quantidade WHERE Id = @PecaId", new { old.Quantidade, old.PecaId }, transaction);
                    }

                    // Apaga os itens velhos
                    await connection.ExecuteAsync("DELETE FROM OrdemServicoItens WHERE OrdemServicoId = @Id", new { os.Id }, transaction);

                    // Insere os itens novos e dá baixa novamente
                    if (os.Itens != null && os.Itens.Any())
                    {
                        var sqlItem = @"
                            INSERT INTO OrdemServicoItens (OrdemServicoId, PecaId, Tipo, Descricao, Quantidade, ValorUnitario, ValorTotal) 
                            VALUES (@OrdemServicoId, @PecaId, @Tipo, @Descricao, @Quantidade, @ValorUnitario, @ValorTotal);";

                        foreach (var item in os.Itens)
                        {
                            item.OrdemServicoId = os.Id;
                            await connection.ExecuteAsync(sqlItem, item, transaction);

                            if (item.Tipo == "Peca" && item.PecaId != null)
                            {
                                await DeduzirEstoqueAgrupadoAsync(connection, transaction, os.EmpresaId, item.PecaId.Value, item.Quantidade);
                            }
                        }
                    }
                }

                transaction.Commit();
                return linhas > 0;
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
        }

        public async Task<bool> DeletarAsync(Guid id, Guid empresaId)
        {
            using var connection = _dbFactory.CreateConnection();
            // Diferente de clientes, geralmente não apagamos OS. Apenas mudamos o status para "Cancelada" para manter histórico.
            var sql = "UPDATE OrdensServico SET Status = 'Cancelada' WHERE Id = @Id AND EmpresaId = @EmpresaId;";
            var linhas = await connection.ExecuteAsync(sql, new { Id = id, EmpresaId = empresaId });
            return linhas > 0;
        }

        public async Task<bool> AtualizarStatusAsync(Guid id, Guid empresaId, string status)
        {
            using var connection = _dbFactory.CreateConnection();
            var sql = "UPDATE OrdensServico SET Status = @Status WHERE Id = @Id AND EmpresaId = @EmpresaId;";
            return await connection.ExecuteAsync(sql, new { Status = status, Id = id, EmpresaId = empresaId }) > 0;
        }

        private static async Task DeduzirEstoqueAgrupadoAsync(System.Data.IDbConnection connection, System.Data.IDbTransaction transaction, Guid empresaId, Guid pecaId, decimal quantidadeNecessaria)
        {
            var referencia = await connection.QuerySingleOrDefaultAsync<(string Nome, string? Sku)>(
                "SELECT Nome, Sku FROM EstoquePecas WHERE Id = @PecaId AND EmpresaId = @EmpresaId",
                new { PecaId = pecaId, EmpresaId = empresaId },
                transaction);

            if (string.IsNullOrWhiteSpace(referencia.Nome))
                throw new InvalidOperationException("Peça de referência não encontrada para deduzir estoque.");

            var estoqueAgrupado = (await connection.QueryAsync<(Guid Id, decimal Quantidade)>(@"
                SELECT Id, Quantidade
                FROM EstoquePecas
                WHERE EmpresaId = @EmpresaId
                  AND LOWER(TRIM(Nome)) = LOWER(TRIM(@Nome))
                  AND COALESCE(LOWER(TRIM(Sku)), '') = COALESCE(LOWER(TRIM(@Sku)), '')
                  AND Quantidade > 0
                ORDER BY DataCadastro, Id;",
                new { EmpresaId = empresaId, referencia.Nome, referencia.Sku },
                transaction)).ToList();

            var saldoDisponivel = estoqueAgrupado.Sum(x => x.Quantidade);
            if (saldoDisponivel < quantidadeNecessaria)
                throw new InvalidOperationException("Saldo insuficiente no estoque agrupado para a peça selecionada.");

            var restante = quantidadeNecessaria;
            foreach (var itemEstoque in estoqueAgrupado)
            {
                if (restante <= 0) break;

                var deducao = Math.Min(itemEstoque.Quantidade, restante);
                await connection.ExecuteAsync(
                    "UPDATE EstoquePecas SET Quantidade = Quantidade - @Deducao WHERE Id = @Id;",
                    new { Deducao = deducao, itemEstoque.Id },
                    transaction);

                restante -= deducao;
            }
        }
    }
}
