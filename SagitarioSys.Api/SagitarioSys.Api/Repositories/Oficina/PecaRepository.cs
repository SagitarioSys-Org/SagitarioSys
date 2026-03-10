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
            var sql = @"
                SELECT
                    id AS Id,
                    empresaid AS EmpresaId,
                    nome AS Nome,
                    sku AS Sku,
                    fornecedor AS  Fornecedor,
                    custo AS Custo ,
                    precovenda AS PrecoVenda,
                    quantidade AS Quantidade,
                    estoqueminimo AS EstoqueMinimo
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
                    custo AS Custo,
                    precovenda AS PrecoVenda,
                    quantidade AS Quantidade,
                    estoqueminimo AS EstoqueMinimo
                FROM estoquepecas
                WHERE id = @Id AND empresaid = @EmpresaId;";
            return await connection.QuerySingleOrDefaultAsync<Peca>(sql, new { Id = id, EmpresaId = empresaId });
        }

        public async Task<Guid> CriarAsync(Peca peca)
        {
            using var connection = _dbFactory.CreateConnection();
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
