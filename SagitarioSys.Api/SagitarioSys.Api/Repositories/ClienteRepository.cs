using Dapper;
using SagitarioSys.Api.Data;
using SagitarioSys.Api.Models;

namespace SagitarioSys.Api.Repositories
{
    public class ClienteRepository
    {
        private readonly IDbConnectionFactory _dbFactory;

        public ClienteRepository(IDbConnectionFactory dbFactory)
        {
            _dbFactory = dbFactory;
        }

        public async Task<IEnumerable<Cliente>> ObterTodosAsync(Guid empresaId)
        {
            using var connection = _dbFactory.CreateConnection();
            var sql = "SELECT * FROM Clientes WHERE EmpresaId = @EmpresaId ORDER BY Nome";
            return await connection.QueryAsync<Cliente>(sql, new { EmpresaId = empresaId });
        }

        public async Task<Cliente?> ObterPorIdAsync(Guid id, Guid empresaId)
        {
            using var connection = _dbFactory.CreateConnection();
            var sql = "SELECT * FROM Clientes WHERE Id = @Id AND EmpresaId = @EmpresaId";
            return await connection.QuerySingleOrDefaultAsync<Cliente>(sql, new { Id = id, EmpresaId = empresaId });
        }

        public async Task<Guid> CriarAsync(Cliente cliente)
        {
            using var connection = _dbFactory.CreateConnection();
            var sql = @"
                INSERT INTO Clientes (EmpresaId, Nome, Telefone, WhatsApp, Observacoes) 
                VALUES (@EmpresaId, @Nome, @Telefone, @WhatsApp, @Observacoes) 
                RETURNING Id;";

            return await connection.QuerySingleAsync<Guid>(sql, cliente);
        }

        public async Task<bool> AtualizarAsync(Cliente cliente)
        {
            using var connection = _dbFactory.CreateConnection();
            var sql = @"
                UPDATE Clientes 
                SET Nome = @Nome, Telefone = @Telefone, WhatsApp = @WhatsApp, Observacoes = @Observacoes, Ativo = @Ativo
                WHERE Id = @Id AND EmpresaId = @EmpresaId;";

            var linhasAfetadas = await connection.ExecuteAsync(sql, cliente);
            return linhasAfetadas > 0;
        }

        public async Task<bool> DeletarAsync(Guid id, Guid empresaId)
        {
            using var connection = _dbFactory.CreateConnection();
            // Recomendação: Soft Delete (apenas inativar) ao invés de apagar fisicamente, 
            // pois o cliente pode estar vinculado a Ordens de Serviço antigas.
            var sql = "UPDATE Clientes SET Ativo = FALSE WHERE Id = @Id AND EmpresaId = @EmpresaId;";

            var linhasAfetadas = await connection.ExecuteAsync(sql, new { Id = id, EmpresaId = empresaId });
            return linhasAfetadas > 0;
        }
    }
}