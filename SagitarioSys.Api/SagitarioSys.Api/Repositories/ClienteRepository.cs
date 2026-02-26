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
            var sqlClientes = "SELECT * FROM Clientes WHERE EmpresaId = @EmpresaId AND Ativo = TRUE ORDER BY Nome;";
            var clientes = (await connection.QueryAsync<Cliente>(sqlClientes, new { EmpresaId = empresaId })).ToList();

            var sqlContatos = @"
                SELECT cc.* FROM ContatosCliente cc 
                INNER JOIN Clientes c ON cc.ClienteId = c.Id 
                WHERE c.EmpresaId = @EmpresaId AND c.Ativo = TRUE";
            var todosContatos = (await connection.QueryAsync<ContatoCliente>(sqlContatos, new { EmpresaId = empresaId })).ToList();

            foreach (var c in clientes)
            {
                c.Contatos = todosContatos.Where(x => x.ClienteId == c.Id).ToList();
            }

            return clientes;
        }

        public async Task<Cliente?> ObterPorIdAsync(Guid id, Guid empresaId)
        {
            using var connection = _dbFactory.CreateConnection();
            var sqlCliente = "SELECT * FROM Clientes WHERE Id = @Id AND EmpresaId = @EmpresaId;";
            var cliente = await connection.QuerySingleOrDefaultAsync<Cliente>(sqlCliente, new { Id = id, EmpresaId = empresaId });

            if (cliente != null)
            {
                var sqlContatos = "SELECT * FROM ContatosCliente WHERE ClienteId = @Id";
                cliente.Contatos = (await connection.QueryAsync<ContatoCliente>(sqlContatos, new { Id = id })).ToList();
            }

            return cliente;
        }

        public async Task<Guid> CriarAsync(Cliente cliente)
        {
            using var connection = _dbFactory.CreateConnection();
            connection.Open();
            using var transaction = connection.BeginTransaction();

            try
            {
                var sqlCliente = @"
                    INSERT INTO Clientes (EmpresaId, Nome, CpfCnpj, Cep, Logradouro, Numero, Bairro, Cidade, Estado) 
                    VALUES (@EmpresaId, @Nome, @CpfCnpj, @Cep, @Logradouro, @Numero, @Bairro, @Cidade, @Estado) 
                    RETURNING Id;";

                var id = await connection.QuerySingleAsync<Guid>(sqlCliente, cliente, transaction);

                if (cliente.Contatos != null && cliente.Contatos.Any())
                {
                    // SQL ATUALIZADO PARA AS NOVAS COLUNAS
                    var sqlContato = "INSERT INTO ContatosCliente (ClienteId, Contato, Email, Observacao) VALUES (@ClienteId, @Contato, @Email, @Observacao);";
                    foreach (var contato in cliente.Contatos)
                    {
                        contato.ClienteId = id;
                        await connection.ExecuteAsync(sqlContato, contato, transaction);
                    }
                }

                transaction.Commit();
                return id;
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
        }

        public async Task<bool> AtualizarAsync(Cliente cliente)
        {
            using var connection = _dbFactory.CreateConnection();
            connection.Open();
            using var transaction = connection.BeginTransaction();

            try
            {
                var sqlCliente = @"
                    UPDATE Clientes 
                    SET Nome = @Nome, CpfCnpj = @CpfCnpj, Cep = @Cep, 
                        Logradouro = @Logradouro, Numero = @Numero, 
                        Bairro = @Bairro, Cidade = @Cidade, Estado = @Estado 
                    WHERE Id = @Id AND EmpresaId = @EmpresaId;";

                var linhas = await connection.ExecuteAsync(sqlCliente, cliente, transaction);

                if (linhas > 0)
                {
                    await connection.ExecuteAsync("DELETE FROM ContatosCliente WHERE ClienteId = @Id", new { Id = cliente.Id }, transaction);

                    if (cliente.Contatos != null && cliente.Contatos.Any())
                    {
                        var sqlContato = "INSERT INTO ContatosCliente (ClienteId, Contato, Email, Observacao) VALUES (@ClienteId, @Contato, @Email, @Observacao);";
                        foreach (var contato in cliente.Contatos)
                        {
                            contato.ClienteId = cliente.Id;
                            await connection.ExecuteAsync(sqlContato, contato, transaction);
                        }
                    }
                }

                transaction.Commit();
                return linhas > 0;
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
        }

        public async Task<bool> DeletarAsync(Guid id, Guid empresaId)
        {
            using var connection = _dbFactory.CreateConnection();
            var sql = "UPDATE Clientes SET Ativo = FALSE WHERE Id = @Id AND EmpresaId = @EmpresaId;";
            var linhas = await connection.ExecuteAsync(sql, new { Id = id, EmpresaId = empresaId });
            return linhas > 0;
        }
    }
}