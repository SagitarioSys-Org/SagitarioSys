using Dapper;
using SagitarioSys.Api.Data;
using SagitarioSys.Api.Models.Admin;

namespace SagitarioSys.Api.Repositories.Admin
{
    public class SegmentoRepository
    {
        private readonly IDbConnectionFactory _dbFactory;

        public SegmentoRepository(IDbConnectionFactory dbFactory)
        {
            _dbFactory = dbFactory;
        }

        // Para a tela de Cadastro de Assinantes (Apenas os ativos)
        public async Task<IEnumerable<Segmento>> ObterAtivosAsync()
        {
            using var connection = _dbFactory.CreateConnection();
            var sql = "SELECT Id, Nome, Ativo FROM Segmentos WHERE Ativo = TRUE ORDER BY Nome";
            return await connection.QueryAsync<Segmento>(sql);
        }

        // Para a tela do CEO (Mostra todos, inclusive inativos)
        public async Task<IEnumerable<Segmento>> ObterTodosAdminAsync()
        {
            using var connection = _dbFactory.CreateConnection();
            var sql = "SELECT Id, Nome, Ativo FROM Segmentos ORDER BY Nome";
            return await connection.QueryAsync<Segmento>(sql);
        }

        public async Task<Segmento?> ObterPorIdAsync(Guid id)
        {
            using var connection = _dbFactory.CreateConnection();
            var sql = "SELECT Id, Nome, Ativo FROM Segmentos WHERE Id = @Id";
            return await connection.QuerySingleOrDefaultAsync<Segmento>(sql, new { Id = id });
        }

        public async Task<Guid> CriarAsync(Segmento segmento)
        {
            using var connection = _dbFactory.CreateConnection();
            var sql = "INSERT INTO Segmentos (Nome, Ativo) VALUES (@Nome, @Ativo) RETURNING Id;";
            return await connection.QuerySingleAsync<Guid>(sql, segmento);
        }

        public async Task<bool> AtualizarAsync(Segmento segmento)
        {
            using var connection = _dbFactory.CreateConnection();
            var sql = "UPDATE Segmentos SET Nome = @Nome, Ativo = @Ativo WHERE Id = @Id;";
            var linhas = await connection.ExecuteAsync(sql, segmento);
            return linhas > 0;
        }

        public async Task<bool> InativarAsync(Guid id)
        {
            using var connection = _dbFactory.CreateConnection();
            var sql = "UPDATE Segmentos SET Ativo = FALSE WHERE Id = @Id;";
            var linhas = await connection.ExecuteAsync(sql, new { Id = id });
            return linhas > 0;
        }
    }
}