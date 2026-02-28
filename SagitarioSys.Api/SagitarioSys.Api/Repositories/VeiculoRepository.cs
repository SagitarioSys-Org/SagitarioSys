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

            // Usamos uma Subquery (SELECT ... LIMIT 1) para pegar o primeiro telefone salvo do cliente.
            // Isso evita que o veículo apareça duplicado na tabela caso o cliente tenha vários contatos.
            var sql = @"
                SELECT 
                    v.*, 
                    c.Nome AS NomeCliente, 
                    (SELECT Contato FROM ContatosCliente WHERE ClienteId = c.Id LIMIT 1) AS TelefoneCliente
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
                INSERT INTO Veiculos (EmpresaId, ClienteId, Placa, Marca, Modelo, AnoFabricacao, AnoModelo, Cor, Observacoes, KmAtual) 
                VALUES (@EmpresaId, @ClienteId, @Placa, @Marca, @Modelo, @AnoFabricacao, @AnoModelo, @Cor, @Observacoes, @KmAtual) 
                RETURNING Id;";

            try
            {
                // Tenta inserir no banco
                return await connection.QuerySingleAsync<Guid>(sql, veiculo);
            }
            catch (Exception ex)
            {
                // COLOQUE UM BREAKPOINT NA LINHA ABAIXO (F9)
                var erroExatoDoBanco = ex.Message;

                // O Console vai imprimir o erro em vermelho na tela do Visual Studio
                Console.WriteLine($"\n=== ERRO DETECTADO NO BANCO DE DADOS ===\n{erroExatoDoBanco}\n========================================\n");

                throw; // Repassa o erro pra frente depois que você já leu
            }
        }

        public async Task<bool> AtualizarAsync(Veiculo veiculo)
        {
            using var connection = _dbFactory.CreateConnection();
            // Adicionado o KmAtual no UPDATE
            var sql = @"
                UPDATE Veiculos 
                SET ClienteId = @ClienteId, Placa = @Placa, Marca = @Marca, 
                    Modelo = @Modelo, AnoFabricacao = @AnoFabricacao, 
                    AnoModelo = @AnoModelo, Cor = @Cor, Observacoes = @Observacoes,
                    KmAtual = @KmAtual
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