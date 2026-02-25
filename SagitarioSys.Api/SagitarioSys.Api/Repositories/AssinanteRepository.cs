using Dapper;
using SagitarioSys.Api.Data;
using SagitarioSys.Api.Models;

namespace SagitarioSys.Api.Repositories
{
    public class AssinanteRepository
    {
        private readonly IDbConnectionFactory _dbFactory;

        public AssinanteRepository(IDbConnectionFactory dbFactory)
        {
            _dbFactory = dbFactory;
        }

        public async Task<bool> CriarAssinanteCompletoAsync(NovoAssinanteRequest request, string senhaHash)
        {
            using var connection = _dbFactory.CreateConnection();
            connection.Open();
            using var transaction = connection.BeginTransaction();

            try
            {
                // 1. Cria a Empresa e pega o ID gerado
                var sqlEmpresa = @"
                    INSERT INTO Empresas (NomeFantasia, CnpjCpf, SegmentoId) 
                    VALUES (@NomeFantasia, @CnpjCpf, @SegmentoId) 
                    RETURNING Id;";

                var empresaId = await connection.QuerySingleAsync<Guid>(sqlEmpresa, request, transaction);

                // 2. Cria o Usuário Administrador vinculado a essa nova empresa
                var sqlUsuario = @"
                    INSERT INTO Usuarios (EmpresaId, Nome, Email, SenhaHash, Role) 
                    VALUES (@EmpresaId, @NomeAdmin, @EmailAdmin, @SenhaHash, 'Admin');";

                await connection.ExecuteAsync(sqlUsuario, new
                {
                    EmpresaId = empresaId,
                    NomeAdmin = request.NomeAdmin,
                    EmailAdmin = request.EmailAdmin,
                    SenhaHash = senhaHash
                }, transaction);

                // Confirma a transação (se der erro em algum, ele desfaz tudo - Rollback automático)
                transaction.Commit();
                return true;
            }
            catch
            {
                transaction.Rollback();
                throw; // Repassa o erro para o Controller tratar (ex: e-mail já existe)
            }
        }

        // 1. LER TODOS
        public async Task<IEnumerable<Empresa>> ObterTodosAsync()
        {
            using var connection = _dbFactory.CreateConnection();
            var sql = @"
                SELECT e.Id, e.NomeFantasia, e.CnpjCpf, e.SegmentoId, e.Ativo, s.Nome as NomeSegmento 
                FROM Empresas e
                INNER JOIN Segmentos s ON e.SegmentoId = s.Id
                ORDER BY e.NomeFantasia";
            return await connection.QueryAsync<Empresa>(sql);
        }

        // 2. LER POR ID (Para quando formos editar e precisarmos preencher o modal)
        public async Task<Empresa?> ObterPorIdAsync(Guid id)
        {
            using var connection = _dbFactory.CreateConnection();
            var sql = "SELECT Id, NomeFantasia, CnpjCpf, SegmentoId, Ativo FROM Empresas WHERE Id = @Id";
            return await connection.QuerySingleOrDefaultAsync<Empresa>(sql, new { Id = id });
        }

        // 3. ATUALIZAR
        public async Task<bool> AtualizarAsync(Empresa empresa)
        {
            using var connection = _dbFactory.CreateConnection();
            var sql = @"
                UPDATE Empresas 
                SET NomeFantasia = @NomeFantasia, 
                    CnpjCpf = @CnpjCpf, 
                    SegmentoId = @SegmentoId
                WHERE Id = @Id;";

            var linhasAfetadas = await connection.ExecuteAsync(sql, empresa);
            return linhasAfetadas > 0;
        }

        // 4. INATIVAR (Soft Delete)
        public async Task<bool> InativarAsync(Guid id)
        {
            using var connection = _dbFactory.CreateConnection();
            var sql = "UPDATE Empresas SET Ativo = FALSE WHERE Id = @Id;";

            var linhasAfetadas = await connection.ExecuteAsync(sql, new { Id = id });
            return linhasAfetadas > 0;
        }
    }
}