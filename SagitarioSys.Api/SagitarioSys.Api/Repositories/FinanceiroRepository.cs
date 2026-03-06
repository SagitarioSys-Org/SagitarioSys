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

        public async Task<IEnumerable<LancamentoFinanceiro>> ObterTodosAsync(
            Guid empresaId, DateTime dataInicio, DateTime dataFim, string filtroPor = "vencimento")
        {
            using var connection = _dbFactory.CreateConnection();

            // Escolhe a coluna dinamicamente — sem risco de SQL injection pois validamos aqui
            var coluna = filtroPor == "pagamento" ? "datapagamento" : "datavencimento";

            var sql = $@"
                    SELECT 
                        id, empresaid, clienteid, ordemservicoid, tipo, categoria,
                        descricao, valor,
                        CAST(datavencimento AS timestamp) AS DataVencimento,
                        CAST(datapagamento  AS timestamp) AS DataPagamento,
                        status, formapagamento, datacadastro
                    FROM lancamentosfinanceiros
                    WHERE empresaid = @EmpresaId
                      AND {coluna} BETWEEN @DataInicio AND @DataFim
                    ORDER BY {coluna} DESC;";

            return await connection.QueryAsync<LancamentoFinanceiro>(sql, new
            {
                EmpresaId = empresaId,
                DataInicio = dataInicio.Date,
                DataFim = dataFim.Date
            });
        }


        public async Task<LancamentoFinanceiro?> ObterPorIdAsync(Guid id, Guid empresaId)
        {
            using var connection = _dbFactory.CreateConnection();
            var sql = @"
                SELECT 
                    id, empresaid, clienteid, ordemservicoid, tipo, categoria,
                    descricao, valor,
                    CAST(datavencimento AS timestamp) AS DataVencimento,
                    CAST(datapagamento  AS timestamp) AS DataPagamento,
                    status, formapagamento, datacadastro
                FROM lancamentosfinanceiros
                WHERE id = @Id AND empresaid = @EmpresaId;";

            return await connection.QuerySingleOrDefaultAsync<LancamentoFinanceiro>(sql, new { Id = id, EmpresaId = empresaId });
        }

        public async Task<Guid> CriarAsync(LancamentoFinanceiro lancamento)
        {
            using var connection = _dbFactory.CreateConnection();
            var sql = @"
                INSERT INTO lancamentosfinanceiros 
                (empresaid, clienteid, ordemservicoid, tipo, categoria, descricao,
                 valor, datavencimento, datapagamento, status, formapagamento, datacadastro)
                VALUES 
                (@EmpresaId, @ClienteId, @OrdemServicoId, @Tipo, @Categoria, @Descricao,
                 @Valor, @DataVencimento, @DataPagamento, @Status, @FormaPagamento, CURRENT_TIMESTAMP)
                RETURNING id;";

            return await connection.QuerySingleAsync<Guid>(sql, lancamento);
        }

        public async Task<(bool Sucesso, string Mensagem)> AtualizarAsync(LancamentoFinanceiro lancamento)
        {
            using var connection = _dbFactory.CreateConnection();

            // ✅ Trava: bloqueia edição de lançamentos de OS
            var sqlCheck = "SELECT ordemservicoid FROM lancamentosfinanceiros WHERE id = @Id AND empresaid = @EmpresaId;";
            var osId = await connection.QuerySingleOrDefaultAsync<Guid?>(sqlCheck, new { Id = lancamento.Id, EmpresaId = lancamento.EmpresaId });

            if (osId != null)
                return (false, "Este lançamento pertence a uma Ordem de Serviço e não pode ser editado aqui.");

            var sql = @"
                      UPDATE lancamentosfinanceiros 
                      SET clienteid       = @ClienteId,
                          ordemservicoid  = @OrdemServicoId,
                          tipo            = @Tipo,
                          categoria       = @Categoria,
                          descricao       = @Descricao,
                          valor           = @Valor,
                          datavencimento  = @DataVencimento,
                          datapagamento   = @DataPagamento,
                          status          = @Status,
                          formapagamento  = @FormaPagamento
                      WHERE id = @Id AND empresaid = @EmpresaId;";

            return await connection.ExecuteAsync(sql, lancamento) > 0
                ? (true, "Lançamento atualizado com sucesso.")
                : (false, "Lançamento não encontrado.");
        }


        public async Task<(bool Sucesso, string Mensagem)> DeletarAsync(Guid id, Guid empresaId)
        {
            using var connection = _dbFactory.CreateConnection();

            var sqlCheck = "SELECT ordemservicoid FROM lancamentosfinanceiros WHERE id = @Id AND empresaid = @EmpresaId;";
            var osId = await connection.QuerySingleOrDefaultAsync<Guid?>(sqlCheck, new { Id = id, EmpresaId = empresaId });

            if (osId != null)
                return (false, "Este lançamento pertence a uma Ordem de Serviço e não pode ser excluído aqui.");

            var sql = "DELETE FROM lancamentosfinanceiros WHERE id = @Id AND empresaid = @EmpresaId;";
            var rows = await connection.ExecuteAsync(sql, new { Id = id, EmpresaId = empresaId });

            return rows > 0
                ? (true, "Lançamento excluído com sucesso.")
                : (false, "Lançamento não encontrado.");
        }

        public async Task<dynamic> ObterResumoMensalAsync(Guid empresaId, int mes, int ano)
        {
            using var connection = _dbFactory.CreateConnection();
            var sql = @"
                SELECT 
                    COALESCE(SUM(CASE WHEN tipo = 'Receita' AND status = 'Pago' THEN valor ELSE 0 END), 0) AS TotalReceitas,
                    COALESCE(SUM(CASE WHEN tipo = 'Despesa' AND status = 'Pago' THEN valor ELSE 0 END), 0) AS TotalDespesas
                FROM lancamentosfinanceiros
                WHERE empresaid = @EmpresaId
                  AND EXTRACT(MONTH FROM datapagamento) = @Mes
                  AND EXTRACT(YEAR  FROM datapagamento) = @Ano;";

            return await connection.QueryFirstOrDefaultAsync(sql, new { EmpresaId = empresaId, Mes = mes, Ano = ano });
        }
    }
}
