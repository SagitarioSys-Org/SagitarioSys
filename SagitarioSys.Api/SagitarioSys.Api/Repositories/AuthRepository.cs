using Dapper;
using SagitarioSys.Api.Data;
using SagitarioSys.Api.Models;

namespace SagitarioSys.Api.Repositories
{
    // Criamos um DTO (Objeto de Transferência) rápido para pegar Usuário + Empresa juntos
    public class UsuarioAuthDto : Usuario
    {
        public string TipoNegocio { get; set; } = string.Empty;
        public string NomeFantasia { get; set; } = string.Empty;
    }

    public class AuthRepository
    {
        private readonly IDbConnectionFactory _dbFactory;

        public AuthRepository(IDbConnectionFactory dbFactory)
        {
            _dbFactory = dbFactory;
        }

        public async Task<UsuarioAuthDto?> ObterUsuarioPorEmailAsync(string email)
        {
            using var connection = _dbFactory.CreateConnection();

            var sql = @"
                SELECT 
                    u.*, 
                    e.TipoNegocio, 
                    e.NomeFantasia 
                FROM Usuarios u
                INNER JOIN Empresas e ON u.EmpresaId = e.Id
                WHERE u.Email = @Email AND e.Ativo = TRUE";

            return await connection.QuerySingleOrDefaultAsync<UsuarioAuthDto>(sql, new { Email = email });
        }

        // Método provisório APENAS para podermos testar o login hoje
        public async Task CriarUsuarioDeTesteAsync(string senhaHash)
        {
            using var connection = _dbFactory.CreateConnection();

            // 1. Cria uma empresa de teste (Oficina)
            var empresaId = await connection.QuerySingleAsync<Guid>(
                "INSERT INTO Empresas (NomeFantasia, CnpjCpf, TipoNegocio) VALUES ('Oficina Sagitario', '00000000000100', 'Oficina') RETURNING Id;"
            );

            // 2. Cria o usuário vinculado a essa empresa
            var sqlUser = @"
                INSERT INTO Usuarios (EmpresaId, Nome, Email, SenhaHash, Role) 
                VALUES (@EmpresaId, 'Admin Teste', 'admin@teste.com', @SenhaHash, 'Admin')";

            await connection.ExecuteAsync(sqlUser, new { EmpresaId = empresaId, SenhaHash = senhaHash });
        }
    }
}