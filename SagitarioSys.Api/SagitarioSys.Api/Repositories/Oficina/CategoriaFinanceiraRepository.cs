using Dapper;
using SagitarioSys.Api.Data;
using SagitarioSys.Api.Models.Oficina;

namespace SagitarioSys.Api.Repositories.Oficina
{
    public class CategoriaFinanceiraRepository
    {
        private readonly IDbConnectionFactory _dbFactory;

        public CategoriaFinanceiraRepository(IDbConnectionFactory dbFactory)
        {
            _dbFactory = dbFactory;
        }

        public async Task<IEnumerable<CategoriaFinanceira>> ObterTodosAsync(Guid empresaId)
        {
            using var connection = _dbFactory.CreateConnection();
            // Ordena pelo tipo (Entradas juntas, Saídas juntas) e depois em ordem alfabética
            var sql = "SELECT * FROM CategoriasFinanceiras WHERE EmpresaId = @EmpresaId ORDER BY Tipo DESC, Nome ASC;";
            return await connection.QueryAsync<CategoriaFinanceira>(sql, new { EmpresaId = empresaId });
        }

        public async Task<CategoriaFinanceira?> ObterPorIdAsync(Guid id, Guid empresaId)
        {
            using var connection = _dbFactory.CreateConnection();
            var sql = "SELECT * FROM CategoriasFinanceiras WHERE Id = @Id AND EmpresaId = @EmpresaId;";
            return await connection.QuerySingleOrDefaultAsync<CategoriaFinanceira>(sql, new { Id = id, EmpresaId = empresaId });
        }

        public async Task<Guid> CriarAsync(CategoriaFinanceira categoria)
        {
            using var connection = _dbFactory.CreateConnection();
            var sql = @"
                INSERT INTO CategoriasFinanceiras (EmpresaId, Nome, Tipo, DataCadastro) 
                VALUES (@EmpresaId, @Nome, @Tipo, CURRENT_TIMESTAMP)
                RETURNING Id;";
            return await connection.QuerySingleAsync<Guid>(sql, categoria);
        }

        public async Task<bool> AtualizarAsync(CategoriaFinanceira categoria)
        {
            using var connection = _dbFactory.CreateConnection();
            var sql = @"
                UPDATE CategoriasFinanceiras 
                SET Nome = @Nome, Tipo = @Tipo 
                WHERE Id = @Id AND EmpresaId = @EmpresaId;";
            return await connection.ExecuteAsync(sql, categoria) > 0;
        }

        public async Task<bool> DeletarAsync(Guid id, Guid empresaId)
        {
            using var connection = _dbFactory.CreateConnection();
            var sql = "DELETE FROM CategoriasFinanceiras WHERE Id = @Id AND EmpresaId = @EmpresaId;";
            return await connection.ExecuteAsync(sql, new { Id = id, EmpresaId = empresaId }) > 0;
        }
    }
}