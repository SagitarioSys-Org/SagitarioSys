using Dapper;
using SagitarioSys.Api.Data;
using SagitarioSys.Api.Models.Oficina;

namespace SagitarioSys.Api.Repositories.Oficina
{
    public class FornecedorRepository
    {
        private readonly IDbConnectionFactory _dbFactory;

        public FornecedorRepository(IDbConnectionFactory dbFactory)
        {
            _dbFactory = dbFactory;
        }

        private async Task EnsureTableAsync()
        {
            using var connection = _dbFactory.CreateConnection();
            var sql = @"
                CREATE TABLE IF NOT EXISTS Fornecedores (
                    Id uuid PRIMARY KEY,
                    EmpresaId uuid NOT NULL,
                    NomeFantasia varchar(160) NOT NULL,
                    RazaoSocial varchar(200) NULL,
                    Documento varchar(30) NOT NULL,
                    Email varchar(160) NULL,
                    Telefone varchar(30) NULL,
                    Whatsapp varchar(30) NULL,
                    Cep varchar(12) NULL,
                    Logradouro varchar(200) NULL,
                    Numero varchar(20) NULL,
                    Bairro varchar(100) NULL,
                    Cidade varchar(100) NULL,
                    Estado varchar(2) NULL,
                    Observacoes text NULL,
                    Ativo boolean NOT NULL DEFAULT true,
                    CriadoEm timestamptz NOT NULL DEFAULT now(),
                    AtualizadoEm timestamptz NOT NULL DEFAULT now()
                );

                CREATE INDEX IF NOT EXISTS ix_fornecedores_empresa_nome ON Fornecedores(EmpresaId, NomeFantasia);
                CREATE UNIQUE INDEX IF NOT EXISTS ux_fornecedores_empresa_documento ON Fornecedores(EmpresaId, Documento);
            ";

            await connection.ExecuteAsync(sql);
        }

        public async Task<IEnumerable<Fornecedor>> ObterTodosAsync(Guid empresaId, string? busca = null)
        {
            await EnsureTableAsync();
            using var connection = _dbFactory.CreateConnection();
            var sql = @"
                SELECT
                    Id,
                    EmpresaId,
                    NomeFantasia,
                    RazaoSocial,
                    Documento,
                    Email,
                    Telefone,
                    Whatsapp,
                    Cep,
                    Logradouro,
                    Numero,
                    Bairro,
                    Cidade,
                    Estado,
                    Observacoes,
                    Ativo
                FROM Fornecedores
                WHERE EmpresaId = @EmpresaId
                    AND (
                        @Busca IS NULL
                        OR NomeFantasia ILIKE '%' || @Busca || '%'
                        OR COALESCE(RazaoSocial, '') ILIKE '%' || @Busca || '%'
                        OR Documento ILIKE '%' || @Busca || '%'
                    )
                ORDER BY NomeFantasia;";

            return await connection.QueryAsync<Fornecedor>(sql, new { EmpresaId = empresaId, Busca = busca });
        }

        public async Task<Fornecedor?> ObterPorIdAsync(Guid id, Guid empresaId)
        {
            await EnsureTableAsync();
            using var connection = _dbFactory.CreateConnection();
            var sql = @"
                SELECT
                    Id,
                    EmpresaId,
                    NomeFantasia,
                    RazaoSocial,
                    Documento,
                    Email,
                    Telefone,
                    Whatsapp,
                    Cep,
                    Logradouro,
                    Numero,
                    Bairro,
                    Cidade,
                    Estado,
                    Observacoes,
                    Ativo
                FROM Fornecedores
                WHERE Id = @Id AND EmpresaId = @EmpresaId;";

            return await connection.QuerySingleOrDefaultAsync<Fornecedor>(sql, new { Id = id, EmpresaId = empresaId });
        }

        public async Task<Guid> CriarAsync(Fornecedor fornecedor)
        {
            await EnsureTableAsync();
            using var connection = _dbFactory.CreateConnection();
            fornecedor.Id = Guid.NewGuid();
            var sql = @"
                INSERT INTO Fornecedores
                (
                    Id, EmpresaId, NomeFantasia, RazaoSocial, Documento,
                    Email, Telefone, Whatsapp, Cep, Logradouro,
                    Numero, Bairro, Cidade, Estado, Observacoes, Ativo
                )
                VALUES
                (
                    @Id, @EmpresaId, @NomeFantasia, @RazaoSocial, @Documento,
                    @Email, @Telefone, @Whatsapp, @Cep, @Logradouro,
                    @Numero, @Bairro, @Cidade, @Estado, @Observacoes, @Ativo
                );";

            await connection.ExecuteAsync(sql, fornecedor);
            return fornecedor.Id;
        }

        public async Task<bool> AtualizarAsync(Fornecedor fornecedor)
        {
            await EnsureTableAsync();
            using var connection = _dbFactory.CreateConnection();
            var sql = @"
                UPDATE Fornecedores
                SET
                    NomeFantasia = @NomeFantasia,
                    RazaoSocial = @RazaoSocial,
                    Documento = @Documento,
                    Email = @Email,
                    Telefone = @Telefone,
                    Whatsapp = @Whatsapp,
                    Cep = @Cep,
                    Logradouro = @Logradouro,
                    Numero = @Numero,
                    Bairro = @Bairro,
                    Cidade = @Cidade,
                    Estado = @Estado,
                    Observacoes = @Observacoes,
                    Ativo = @Ativo,
                    AtualizadoEm = now()
                WHERE Id = @Id AND EmpresaId = @EmpresaId;";

            return await connection.ExecuteAsync(sql, fornecedor) > 0;
        }
    }
}