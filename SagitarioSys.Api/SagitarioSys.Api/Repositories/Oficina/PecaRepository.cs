using Dapper;
using SagitarioSys.Api.Data;
using SagitarioSys.Api.Models.Oficina;

namespace SagitarioSys.Api.Repositories.Oficina
{
    public class PecaRepository
    {
        private readonly IDbConnectionFactory _dbFactory;

        public PecaRepository(IDbConnectionFactory dbFactory) { _dbFactory = dbFactory; }

        public async Task<IEnumerable<Peca>> ObterTodosAsync(Guid empresaId)
        {
            using var connection = _dbFactory.CreateConnection();
            var sql = @" SELECT
                    id AS Id,
                    empresaid AS EmpresaId,
                    nome AS Nome,
                    sku AS Sku,
                    fornecedor AS  Fornecedor,
                    COALESCE(custo, 0) AS Custo,
                    COALESCE(precovenda, 0) AS PrecoVenda,
                    COALESCE(quantidade, 0) AS Quantidade,
                    COALESCE(estoqueminimo, 0) AS EstoqueMinimo
                FROM estoquepecas
                WHERE empresaid = @EmpresaId
                ORDER BY nome;";
            return await connection.QueryAsync<Peca>(sql, new { EmpresaId = empresaId });
        }

        public async Task<Peca?> ObterPorIdAsync(Guid id, Guid empresaId)
        {
            using var connection = _dbFactory.CreateConnection();
            var sql = @"
                SELECT
                    id AS Id,
                    empresaid AS EmpresaId,
                    nome AS Nome,
                    sku AS Sku,
                    fornecedor AS Fornecedor,
                    COALESCE(custo, 0) AS Custo,
                    COALESCE(precovenda, 0) AS PrecoVenda,
                    COALESCE(quantidade, 0) AS Quantidade,
                    COALESCE(estoqueminimo, 0) AS EstoqueMinimo
                FROM estoquepecas
                WHERE id = @Id AND empresaid = @EmpresaId;";
            return await connection.QuerySingleOrDefaultAsync<Peca>(sql, new { Id = id, EmpresaId = empresaId });
        }

        public async Task<Guid> CriarAsync(Peca peca)
        {
            using var connection = _dbFactory.CreateConnection();

            if (!string.IsNullOrWhiteSpace(peca.Sku))
            {
                var existente = await connection.QuerySingleOrDefaultAsync<Peca>(@"
                    SELECT
                        id AS Id,
                        empresaid AS EmpresaId,
                        nome AS Nome,
                        sku AS Sku,
                        fornecedor AS Fornecedor,
                        custo AS Custo,
                        precovenda AS PrecoVenda,
                        quantidade AS Quantidade,
                        estoqueminimo AS EstoqueMinimo
                    FROM EstoquePecas
                    WHERE EmpresaId = @EmpresaId
                      AND LOWER(TRIM(Sku)) = LOWER(TRIM(@Sku))
                    ORDER BY nome
                    LIMIT 1;", new { peca.EmpresaId, peca.Sku });

                if (existente != null)
                {
                    var novaQuantidade = existente.Quantidade + peca.Quantidade;
                    var novoCusto = novaQuantidade > 0
                        ? ((existente.Custo * existente.Quantidade) + (peca.Custo * peca.Quantidade)) / novaQuantidade
                        : peca.Custo;
                    var novoPrecoVenda = novaQuantidade > 0
                        ? ((existente.PrecoVenda * existente.Quantidade) + (peca.PrecoVenda * peca.Quantidade)) / novaQuantidade
                        : peca.PrecoVenda;

                    existente.Nome = string.IsNullOrWhiteSpace(peca.Nome) ? existente.Nome : peca.Nome;
                    existente.Fornecedor = string.IsNullOrWhiteSpace(peca.Fornecedor) ? existente.Fornecedor : peca.Fornecedor;
                    existente.Custo = novoCusto;
                    existente.PrecoVenda = novoPrecoVenda;
                    existente.Quantidade = novaQuantidade;
                    existente.EstoqueMinimo = Math.Max(existente.EstoqueMinimo, peca.EstoqueMinimo);

                    await AtualizarAsync(existente);
                    return existente.Id;
                }
            }

            var sql = @"
                INSERT INTO EstoquePecas (EmpresaId, Nome, Sku, Fornecedor, Custo, PrecoVenda, Quantidade, EstoqueMinimo) 
                VALUES (@EmpresaId, @Nome, @Sku, @Fornecedor, @Custo, @PrecoVenda, @Quantidade, @EstoqueMinimo) 
                RETURNING Id;";
            return await connection.QuerySingleAsync<Guid>(sql, peca);
        }

        public async Task<bool> AtualizarAsync(Peca peca)
        {
            using var connection = _dbFactory.CreateConnection();
            var sql = @"
                UPDATE EstoquePecas 
                SET Nome = @Nome, Sku = @Sku, Fornecedor = @Fornecedor, 
                    Custo = @Custo, PrecoVenda = @PrecoVenda, 
                    Quantidade = @Quantidade, EstoqueMinimo = @EstoqueMinimo 
                WHERE Id = @Id AND EmpresaId = @EmpresaId;";
            return await connection.ExecuteAsync(sql, peca) > 0;
        }

        public async Task<bool> DeletarAsync(Guid id, Guid empresaId)
        {
            using var connection = _dbFactory.CreateConnection();
            var sql = "DELETE FROM EstoquePecas WHERE Id = @Id AND EmpresaId = @EmpresaId;";
            return await connection.ExecuteAsync(sql, new { Id = id, EmpresaId = empresaId }) > 0;
        }
    }
}
