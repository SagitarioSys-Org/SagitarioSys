using Dapper;
using SagitarioSys.Api.Data;
using SagitarioSys.Api.Models;

namespace SagitarioSys.Api.Repositories
{
    public class MenuRepository
    {
        private readonly IDbConnectionFactory _dbFactory;

        public MenuRepository(IDbConnectionFactory dbFactory)
        {
            _dbFactory = dbFactory;
        }

        // 1. Traz os menus para o Front-end desenhar o menu lateral (Agora traz o MenuPaiId)
        public async Task<IEnumerable<Menu>> ObterMenusPorSegmentoAsync(string nomeSegmento, Guid empresaId)
        {
            using var connection = _dbFactory.CreateConnection();
            var sql = @"
                SELECT m.Id, m.SegmentoId, m.MenuPaiId, m.Titulo, m.Icone, m.Rota, m.Ordem 
                FROM Menus m
                LEFT JOIN Segmentos s ON m.SegmentoId = s.Id
                WHERE 
                    (s.Nome = @NomeSegmento AND m.EmpresaId IS NULL AND s.Ativo = TRUE
                     AND m.Id NOT IN (SELECT MenuId FROM MenusOcultosEmpresa WHERE EmpresaId = @EmpresaId))
                    OR (m.EmpresaId = @EmpresaId)
                ORDER BY m.MenuPaiId NULLS FIRST, m.Ordem;"; // Traz os Pais primeiro, depois ordena

            return await connection.QueryAsync<Menu>(sql, new { NomeSegmento = nomeSegmento, EmpresaId = empresaId });
        }

        // 2. Traz todos os menus para a sua tela de Gestão (CEO)
        public async Task<IEnumerable<Menu>> ObterTodosAdminAsync()
        {
            using var connection = _dbFactory.CreateConnection();
            var sql = @"
                SELECT m.Id, m.SegmentoId, m.EmpresaId, m.MenuPaiId, m.Titulo, m.Icone, m.Rota, m.Ordem, 
                       s.Nome AS NomeSegmento, e.NomeFantasia AS NomeEmpresa,
                       pai.Titulo AS NomeMenuPai
                FROM Menus m
                INNER JOIN Segmentos s ON m.SegmentoId = s.Id
                LEFT JOIN Empresas e ON m.EmpresaId = e.Id
                LEFT JOIN Menus pai ON m.MenuPaiId = pai.Id
                ORDER BY s.Nome, pai.Titulo NULLS FIRST, m.Ordem;";

            return await connection.QueryAsync<Menu>(sql);
        }

        // 3. Criar
        public async Task<Guid> CriarAsync(Menu menu)
        {
            using var connection = _dbFactory.CreateConnection();
            var sql = @"
                INSERT INTO Menus (SegmentoId, EmpresaId, MenuPaiId, Titulo, Icone, Rota, Ordem) 
                VALUES (@SegmentoId, @EmpresaId, @MenuPaiId, @Titulo, @Icone, @Rota, @Ordem) 
                RETURNING Id;";
            return await connection.QuerySingleAsync<Guid>(sql, menu);
        }

        // 4. Atualizar
        public async Task<bool> AtualizarAsync(Menu menu)
        {
            using var connection = _dbFactory.CreateConnection();
            var sql = @"
                UPDATE Menus 
                SET SegmentoId = @SegmentoId, EmpresaId = @EmpresaId, MenuPaiId = @MenuPaiId, 
                    Titulo = @Titulo, Icone = @Icone, Rota = @Rota, Ordem = @Ordem 
                WHERE Id = @Id;";
            var linhas = await connection.ExecuteAsync(sql, menu);
            return linhas > 0;
        }


        public async Task<Menu?> ObterPorIdAsync(Guid id)
        {
            using var connection = _dbFactory.CreateConnection();
            var sql = "SELECT * FROM Menus WHERE Id = @Id";
            return await connection.QuerySingleOrDefaultAsync<Menu>(sql, new { Id = id });
        }

        public async Task<bool> DeletarAsync(Guid id)
        {
            using var connection = _dbFactory.CreateConnection();
            // Diferente de clientes, Menu nós podemos apagar fisicamente do banco
            var sql = "DELETE FROM Menus WHERE Id = @Id;";
            var linhas = await connection.ExecuteAsync(sql, new { Id = id });
            return linhas > 0;
        }
    }
}