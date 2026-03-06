using Dapper;
using SagitarioSys.Api.Data;
using SagitarioSys.Api.Models.Admin;

namespace SagitarioSys.Api.Repositories
{
    public class UsuarioAuthDto : Usuario
    {
        public string TipoNegocio { get; set; } = string.Empty;
        public string NomeFantasia { get; set; } = string.Empty;
        public string RotaDashboard { get; set; } = string.Empty;
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

            // Alteramos a query para fazer JOIN na tabela Segmentos
            var sql = @"
                SELECT 
                    u.*, 
                    s.Nome AS TipoNegocio, -- Pega o nome dinâmico (Oficina, SaaS, etc)
                    e.NomeFantasia,
                    s.RotaDashboard
                FROM Usuarios u
                INNER JOIN Empresas e ON u.EmpresaId = e.Id
                INNER JOIN Segmentos s ON e.SegmentoId = s.Id
                WHERE u.Email = @Email AND e.Ativo = TRUE";

            return await connection.QuerySingleOrDefaultAsync<UsuarioAuthDto>(sql, new { Email = email });
        }
    }
}