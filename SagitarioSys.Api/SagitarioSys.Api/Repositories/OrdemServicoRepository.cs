using Dapper;
using SagitarioSys.Api.Data;
using SagitarioSys.Api.Models;

namespace SagitarioSys.Api.Repositories
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
                    o.*, 
                    c.Nome AS NomeCliente, 
                    v.Placa AS PlacaVeiculo, 
                    v.Modelo AS ModeloVeiculo
                FROM OrdensServico o
                INNER JOIN Clientes c ON o.ClienteId = c.Id
                INNER JOIN Veiculos v ON o.VeiculoId = v.Id
                WHERE o.EmpresaId = @EmpresaId
                ORDER BY o.NumeroOS DESC;";

            return await connection.QueryAsync<OrdemServico>(sql, new { EmpresaId = empresaId });
        }

        public async Task<OrdemServico?> ObterPorIdAsync(Guid id, Guid empresaId)
        {
            using var connection = _dbFactory.CreateConnection();

            // Query segura: Usando apenas Nome, Placa e Modelo, que já sabemos que funcionam!
            var sqlOS = @"
                SELECT 
                    o.*, 
                    c.Nome AS NomeCliente, 
                    v.Placa AS PlacaVeiculo, 
                    v.Modelo AS ModeloVeiculo
                FROM OrdensServico o
                INNER JOIN Clientes c ON o.ClienteId = c.Id
                INNER JOIN Veiculos v ON o.VeiculoId = v.Id
                WHERE o.Id = @Id AND o.EmpresaId = @EmpresaId;";

            var os = await connection.QuerySingleOrDefaultAsync<OrdemServico>(sqlOS, new { Id = id, EmpresaId = empresaId });

            if (os != null)
            {
                var sqlItens = "SELECT * FROM OrdemServicoItens WHERE OrdemServicoId = @Id";
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
                            await connection.ExecuteAsync("UPDATE EstoquePecas SET Quantidade = Quantidade - @Quantidade WHERE Id = @PecaId", new { item.Quantidade, item.PecaId }, transaction);
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
                    var oldItens = await connection.QueryAsync<OrdemServicoItem>("SELECT PecaId, Quantidade FROM OrdemServicoItens WHERE OrdemServicoId = @Id AND Tipo = 'Peca' AND PecaId IS NOT NULL", new { Id = os.Id }, transaction);
                    foreach (var old in oldItens)
                    {
                        await connection.ExecuteAsync("UPDATE EstoquePecas SET Quantidade = Quantidade + @Quantidade WHERE Id = @PecaId", new { old.Quantidade, old.PecaId }, transaction);
                    }

                    // Apaga os itens velhos
                    await connection.ExecuteAsync("DELETE FROM OrdemServicoItens WHERE OrdemServicoId = @Id", new { Id = os.Id }, transaction);

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
                                await connection.ExecuteAsync("UPDATE EstoquePecas SET Quantidade = Quantidade - @Quantidade WHERE Id = @PecaId", new { item.Quantidade, item.PecaId }, transaction);
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
    }
}