using Dapper;
using SagitarioSys.Api.Data;
using SagitarioSys.Api.Models;

namespace SagitarioSys.Api.Repositories
{
    public class VeiculoRepository
    {
        private readonly IDbConnectionFactory _dbFactory;

        public VeiculoRepository(IDbConnectionFactory dbFactory)
        {
            _dbFactory = dbFactory;
        }

        public async Task<IEnumerable<Veiculo>> ObterTodosAsync(Guid empresaId)
        {
            using var connection = _dbFactory.CreateConnection();
            var sql = @"
                SELECT v.*, c.Nome AS NomeCliente, c.Telefone AS TelefoneCliente
                FROM Veiculos v
                INNER JOIN Clientes c ON v.ClienteId = c.Id
                WHERE v.EmpresaId = @EmpresaId
                ORDER BY v.DataCadastro DESC;";

            return await connection.QueryAsync<Veiculo>(sql, new { EmpresaId = empresaId });
        }

        public async Task<Veiculo?> ObterPorIdAsync(Guid id, Guid empresaId)
        {
            using var connection = _dbFactory.CreateConnection();
            var sql = "SELECT * FROM Veiculos WHERE Id = @Id AND EmpresaId = @EmpresaId";
            return await connection.QuerySingleOrDefaultAsync<Veiculo>(sql, new { Id = id, EmpresaId = empresaId });
        }

        public async Task<Guid> CriarAsync(Veiculo veiculo)
        {
            using var connection = _dbFactory.CreateConnection();
            var sql = @"
                INSERT INTO Veiculos (EmpresaId, ClienteId, Placa, Marca, Modelo, Ano, Cor, Observacoes) 
                VALUES (@EmpresaId, @ClienteId, @Placa, @Marca, @Modelo, @Ano, @Cor, @Observacoes) 
                RETURNING Id;";

            return await connection.QuerySingleAsync<Guid>(sql, veiculo);
        }

        public async Task<bool> AtualizarAsync(Veiculo veiculo)
        {
            using var connection = _dbFactory.CreateConnection();
            var sql = @"
                UPDATE Veiculos 
                SET ClienteId = @ClienteId, Placa = @Placa, Marca = @Marca, 
                    Modelo = @Modelo, Ano = @Ano, Cor = @Cor, Observacoes = @Observacoes 
                WHERE Id = @Id AND EmpresaId = @EmpresaId;";

            var linhas = await connection.ExecuteAsync(sql, veiculo);
            return linhas > 0;
        }

        public async Task<bool> DeletarAsync(Guid id, Guid empresaId)
        {
            using var connection = _dbFactory.CreateConnection();
            var sql = "UPDATE Veiculos SET Ativo = FALSE WHERE Id = @Id AND EmpresaId = @EmpresaId;";
            var linhas = await connection.ExecuteAsync(sql, new { Id = id, EmpresaId = empresaId });
            return linhas > 0;
        }
    }
}