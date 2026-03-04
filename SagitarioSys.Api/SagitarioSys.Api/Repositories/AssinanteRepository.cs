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
                // 1. Cria a Empresa com TODOS os dados novos
                var sqlEmpresa = @"
                    INSERT INTO Empresas (
                        NomeFantasia, RazaoSocial, CnpjCpf, InscricaoEstadual, SegmentoId, 
                        Telefone, EmailContato, Cep, Logradouro, Numero, Complemento, Bairro, Cidade, Uf
                    ) 
                    VALUES (
                        @NomeFantasia, @RazaoSocial, @CnpjCpf, @InscricaoEstadual, @SegmentoId, 
                        @TelefoneEmpresa, @EmailContatoEmpresa, @Cep, @Logradouro, @Numero, @Complemento, @Bairro, @Cidade, @Uf
                    ) 
                    RETURNING Id;";

                var empresaId = await connection.QuerySingleAsync<Guid>(sqlEmpresa, request, transaction);

                // 2. Cria o Usuário Dono passando o Cpf e Telefone dele
                var sqlUsuario = @"
                    INSERT INTO Usuarios (EmpresaId, Nome, Cpf, Telefone, Email, SenhaHash, Role) 
                    VALUES (@EmpresaId, @NomeAdmin, @CpfAdmin, @TelefoneAdmin, @EmailAdmin, @SenhaHash, 'Admin');";

                await connection.ExecuteAsync(sqlUsuario, new
                {
                    EmpresaId = empresaId,
                    NomeAdmin = request.NomeAdmin,
                    CpfAdmin = request.CpfAdmin,
                    TelefoneAdmin = request.TelefoneAdmin,
                    EmailAdmin = request.EmailAdmin,
                    SenhaHash = senhaHash
                }, transaction);

                transaction.Commit();
                return true;
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
        }

        // LER TODOS (Mantém o Join para listar o email na tabela inicial)
        public async Task<IEnumerable<Empresa>> ObterTodosAsync()
        {
            using var connection = _dbFactory.CreateConnection();
            var sql = @"
                SELECT 
                    e.Id, e.NomeFantasia, e.CnpjCpf, e.SegmentoId, e.Ativo, 
                    s.Nome as NomeSegmento, 
                    u.Email as EmailAdmin
                FROM Empresas e
                INNER JOIN Segmentos s ON e.SegmentoId = s.Id
                LEFT JOIN Usuarios u ON e.Id = u.EmpresaId AND u.Role = 'Admin'
                ORDER BY e.NomeFantasia;";

            return await connection.QueryAsync<Empresa>(sql);
        }

        // LER POR ID (Atualizado para buscar os dados de endereço e contatos na hora de editar)
        public async Task<Empresa?> ObterPorIdAsync(Guid id)
        {
            using var connection = _dbFactory.CreateConnection();
            var sql = @"
                SELECT 
                    Id, NomeFantasia, RazaoSocial, CnpjCpf, InscricaoEstadual, SegmentoId, 
                    Telefone, EmailContato, Cep, Logradouro, Numero, Complemento, Bairro, Cidade, Uf, Ativo 
                FROM Empresas 
                WHERE Id = @Id";
            return await connection.QuerySingleOrDefaultAsync<Empresa>(sql, new { Id = id });
        }

        // ATUALIZAR (Atualizado para salvar as alterações do endereço e contato)
        public async Task<bool> AtualizarAsync(Empresa empresa)
        {
            using var connection = _dbFactory.CreateConnection();
            var sql = @"
                UPDATE Empresas 
                SET NomeFantasia = @NomeFantasia, 
                    RazaoSocial = @RazaoSocial,
                    CnpjCpf = @CnpjCpf, 
                    InscricaoEstadual = @InscricaoEstadual,
                    SegmentoId = @SegmentoId,
                    Telefone = @Telefone,
                    EmailContato = @EmailContato,
                    Cep = @Cep,
                    Logradouro = @Logradouro,
                    Numero = @Numero,
                    Complemento = @Complemento,
                    Bairro = @Bairro,
                    Cidade = @Cidade,
                    Uf = @Uf
                WHERE Id = @Id;";

            var linhasAfetadas = await connection.ExecuteAsync(sql, empresa);
            return linhasAfetadas > 0;
        }

        // ALTERNAR STATUS (O bloqueio/desbloqueio que criamos)
        public async Task<bool> AlternarStatusAsync(Guid id)
        {
            using var connection = _dbFactory.CreateConnection();
            var sql = "UPDATE Empresas SET Ativo = NOT Ativo WHERE Id = @Id;";
            var linhasAfetadas = await connection.ExecuteAsync(sql, new { Id = id });
            return linhasAfetadas > 0;
        }

        // RESET DE SENHA DO SUPORTE
        public async Task<bool> ResetarSenhaAdminAsync(Guid empresaId, string novaSenhaHash)
        {
            using var connection = _dbFactory.CreateConnection();
            var sql = @"
                UPDATE Usuarios 
                SET SenhaHash = @SenhaHash 
                WHERE EmpresaId = @EmpresaId AND Role = 'Admin';";

            var linhasAfetadas = await connection.ExecuteAsync(sql, new { SenhaHash = novaSenhaHash, EmpresaId = empresaId });
            return linhasAfetadas > 0;
        }
    }
}