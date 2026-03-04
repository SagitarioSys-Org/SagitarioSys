using Dapper;
using SagitarioSys.Api.Data;
using SagitarioSys.Api.Models;

namespace SagitarioSys.Api.Repositories
{
    public class FinanceiroRepository
    {
        private readonly IDbConnectionFactory _dbFactory;

        public FinanceiroRepository(IDbConnectionFactory dbFactory)
        {
            _dbFactory = dbFactory;
        }

        public async Task<IEnumerable<LancamentoFinanceiro>> ObterTodosAsync(Guid empresaId)
        {
            using var connection = _dbFactory.CreateConnection();

            // Trocamos o SELECT * por colunas explícitas fazendo CAST nas datas
            var sql = @"
                SELECT 
                    Id, EmpresaId, ClienteId, OrdemServicoId, Tipo, Categoria, Descricao, Valor, 
                    CAST(DataVencimento AS timestamp) AS DataVencimento, 
                    CAST(DataPagamento AS timestamp) AS DataPagamento, 
                    Status, FormaPagamento, DataCadastro 
                FROM LancamentosFinanceiros 
                WHERE EmpresaId = @EmpresaId 
                ORDER BY DataVencimento DESC;";

            return await connection.QueryAsync<LancamentoFinanceiro>(sql, new { EmpresaId = empresaId });
        }

        public async Task<LancamentoFinanceiro?> ObterPorIdAsync(Guid id, Guid empresaId)
        {
            using var connection = _dbFactory.CreateConnection();
            var sql = @"
                SELECT 
                    Id, EmpresaId, ClienteId, OrdemServicoId, Tipo, Categoria, Descricao, Valor, 
                    CAST(DataVencimento AS timestamp) AS DataVencimento, 
                    CAST(DataPagamento AS timestamp) AS DataPagamento, 
                    Status, FormaPagamento, DataCadastro 
                FROM LancamentosFinanceiros 
                WHERE Id = @Id AND EmpresaId = @EmpresaId;";

            return await connection.QuerySingleOrDefaultAsync<LancamentoFinanceiro>(sql, new { Id = id, EmpresaId = empresaId });
        }

        public async Task<Guid> CriarAsync(LancamentoFinanceiro lancamento)
        {
            using var connection = _dbFactory.CreateConnection();
            var sql = @"
                INSERT INTO LancamentosFinanceiros 
                (EmpresaId, ClienteId, OrdemServicoId, Tipo, Categoria, Descricao, Valor, DataVencimento, DataPagamento, Status, FormaPagamento, DataCadastro) 
                VALUES 
                (@EmpresaId, @ClienteId, @OrdemServicoId, @Tipo, @Categoria, @Descricao, @Valor, @DataVencimento, @DataPagamento, @Status, @FormaPagamento, CURRENT_TIMESTAMP)
                RETURNING Id;";

            return await connection.QuerySingleAsync<Guid>(sql, lancamento);
        }

        public async Task<bool> AtualizarAsync(LancamentoFinanceiro lancamento)
        {
            using var connection = _dbFactory.CreateConnection();
            var sql = @"
                UPDATE LancamentosFinanceiros 
                SET ClienteId = @ClienteId, OrdemServicoId = @OrdemServicoId, Tipo = @Tipo, 
                    Categoria = @Categoria, Descricao = @Descricao, Valor = @Valor, 
                    DataVencimento = @DataVencimento, DataPagamento = @DataPagamento, 
                    Status = @Status, FormaPagamento = @FormaPagamento
                WHERE Id = @Id AND EmpresaId = @EmpresaId;";

            return await connection.ExecuteAsync(sql, lancamento) > 0;
        }

        public async Task<bool> DeletarAsync(Guid id, Guid empresaId)
        {
            using var connection = _dbFactory.CreateConnection();

            // Trava de Segurança: Verifica se o lançamento veio de uma OS
            var sqlCheck = "SELECT OrdemServicoId FROM LancamentosFinanceiros WHERE Id = @Id AND EmpresaId = @EmpresaId;";
            var osId = await connection.QuerySingleOrDefaultAsync<Guid?>(sqlCheck, new { Id = id, EmpresaId = empresaId });

            if (osId != null)
            {
                throw new Exception("Este lançamento pertence a uma Ordem de Serviço. Você não pode apagá-lo por aqui.");
            }

            var sql = "DELETE FROM LancamentosFinanceiros WHERE Id = @Id AND EmpresaId = @EmpresaId;";
            return await connection.ExecuteAsync(sql, new { Id = id, EmpresaId = empresaId }) > 0;
        }

        // BÔNUS PARA O DASHBOARD: Consulta para somar Entradas e Saídas do Mês
        public async Task<dynamic> ObterResumoMensalAsync(Guid empresaId, int mes, int ano)
        {
            using var connection = _dbFactory.CreateConnection();
            var sql = @"
                SELECT 
                    COALESCE(SUM(CASE WHEN Tipo = 'Receita' AND Status = 'Pago' THEN Valor ELSE 0 END), 0) AS TotalReceitas,
                    COALESCE(SUM(CASE WHEN Tipo = 'Despesa' AND Status = 'Pago' THEN Valor ELSE 0 END), 0) AS TotalDespesas
                FROM LancamentosFinanceiros
                WHERE EmpresaId = @EmpresaId 
                  AND EXTRACT(MONTH FROM DataPagamento) = @Mes 
                  AND EXTRACT(YEAR FROM DataPagamento) = @Ano;";

            return await connection.QueryFirstOrDefaultAsync(sql, new { EmpresaId = empresaId, Mes = mes, Ano = ano });
        }
    }
}