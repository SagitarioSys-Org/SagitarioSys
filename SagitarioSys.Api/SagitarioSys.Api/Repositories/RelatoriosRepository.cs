using Dapper;
using SagitarioSys.Api.Data;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace SagitarioSys.Api.Repositories
{
    public class RelatoriosRepository
    {
        private readonly IDbConnectionFactory _dbFactory;

        public RelatoriosRepository(IDbConnectionFactory dbFactory)
        {
            _dbFactory = dbFactory;
        }

        public async Task<IEnumerable<dynamic>> ObterEstoqueAsync(Guid empresaId)
        {
            using var connection = _dbFactory.CreateConnection();
            var sql = @"
                SELECT 
                    id, nome, sku, fornecedor,
                    custo, precovenda, quantidade, estoqueminimo
                FROM estoquepecas
                WHERE empresaid = @EmpresaId
                ORDER BY nome ASC;";

            return await connection.QueryAsync(sql, new { EmpresaId = empresaId });
        }

        public async Task<IEnumerable<dynamic>> ObterVendasPeriodoAsync(Guid empresaId, DateTime dataInicio, DateTime dataFim)
        {
            using var connection = _dbFactory.CreateConnection();
            var sql = @"
                      SELECT 
                          os.id,
                          os.numeroos,
                          os.dataabertura,
                          os.valortotal,
                          c.nome AS nomecliente,
                          v.placa,
                          v.marca,
                          v.modelo,
                          lf.formapagamento,
                          COALESCE(lf.datapagamento, os.dataabertura::date) AS datapagamento
                      FROM ordensservico os
                      INNER JOIN clientes c ON os.clienteid = c.id
                      INNER JOIN veiculos v ON os.veiculoid = v.id
                      LEFT JOIN lancamentosfinanceiros lf ON lf.ordemservicoid = os.id
                      WHERE os.empresaid = @EmpresaId
                        AND os.status = 'Faturada'
                        AND (os.dataabertura AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date 
                            BETWEEN @DataInicio AND @DataFim
                      ORDER BY os.dataabertura DESC;";
            ;


            return await connection.QueryAsync(sql, new
            {
                EmpresaId = empresaId,
                DataInicio = dataInicio.Date,
                DataFim = dataFim.Date
            });

        }

        public async Task<IEnumerable<dynamic>> ObterServicosRealizadosAsync(Guid empresaId, DateTime dataInicio, DateTime dataFim)
        {
            using var connection = _dbFactory.CreateConnection();
            var sql = @"
                      SELECT 
                          osi.descricao,
                          COUNT(*) AS totalvezes,
                          SUM(osi.quantidade) AS totalquantidade,
                          SUM(osi.valortotal) AS totalfaturado,
                          AVG(osi.valorunitario) AS valormediounitario
                      FROM ordemservicoitens osi
                      INNER JOIN ordensservico os ON osi.ordemservicoid = os.id
                      WHERE os.empresaid = @EmpresaId
                        AND osi.tipo = 'Servico'
                        AND os.status = 'Faturada'
                        AND (os.dataabertura AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date
                            BETWEEN @DataInicio AND @DataFim
                      GROUP BY osi.descricao
                      ORDER BY totalvezes DESC;";

            return await connection.QueryAsync(sql, new
            {
                EmpresaId = empresaId,
                DataInicio = dataInicio.Date,
                DataFim = dataFim.Date
            });
        }

        public async Task<IEnumerable<dynamic>> ObterPecasVendidasAsync(Guid empresaId, DateTime dataInicio, DateTime dataFim)
        {
            using var connection = _dbFactory.CreateConnection();
            var sql = @"
                       SELECT 
                           osi.descricao,
                           osi.pecaid,
                           COUNT(*) AS totalvezes,
                           SUM(osi.quantidade) AS totalquantidade,
                           SUM(osi.valortotal) AS totalfaturado,
                           AVG(osi.valorunitario) AS valormediounitario,
                           COALESCE(ep.custo, 0) AS custo,
                           COALESCE(ep.custo * SUM(osi.quantidade), 0) AS totalcusto
                       FROM ordemservicoitens osi
                       INNER JOIN ordensservico os ON osi.ordemservicoid = os.id
                       LEFT JOIN estoquepecas ep ON osi.pecaid = ep.id
                       WHERE os.empresaid = @EmpresaId
                         AND osi.tipo = 'Peca'
                         AND os.status = 'Faturada'
                         AND (os.dataabertura AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date
                             BETWEEN @DataInicio AND @DataFim
                       GROUP BY osi.descricao, osi.pecaid, ep.custo
                       ORDER BY totalquantidade DESC;";

            return await connection.QueryAsync(sql, new
            {
                EmpresaId = empresaId,
                DataInicio = dataInicio.Date,
                DataFim = dataFim.Date
            });
        }

        public async Task<dynamic> ObterLucroRealAsync(Guid empresaId, DateTime dataInicio, DateTime dataFim)
        {
            using var connection = _dbFactory.CreateConnection();

            // 1. Faturamento total das OS
            var sqlFaturamento = @"
        SELECT COALESCE(SUM(os.valortotal), 0) AS total
        FROM ordensservico os
        WHERE os.empresaid = @EmpresaId
          AND os.status = 'Faturada'
          AND (os.dataabertura AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date
              BETWEEN @DataInicio AND @DataFim;";

            var faturamento = await connection.ExecuteScalarAsync<decimal>(sqlFaturamento,
                new { EmpresaId = empresaId, DataInicio = dataInicio.Date, DataFim = dataFim.Date });

            // 2. Custo total das peças usadas nas OS
            var sqlCustoPecas = @"
        SELECT COALESCE(SUM(osi.quantidade * COALESCE(ep.custo, 0)), 0) AS total
        FROM ordemservicoitens osi
        INNER JOIN ordensservico os ON osi.ordemservicoid = os.id
        LEFT JOIN estoquepecas ep ON osi.pecaid = ep.id
        WHERE os.empresaid = @EmpresaId
          AND osi.tipo = 'Peca'
          AND os.status = 'Faturada'
          AND (os.dataabertura AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date
              BETWEEN @DataInicio AND @DataFim;";

            var custoPecas = await connection.ExecuteScalarAsync<decimal>(sqlCustoPecas,
                new { EmpresaId = empresaId, DataInicio = dataInicio.Date, DataFim = dataFim.Date });

            // 3. Total de despesas no período
            var sqlDespesas = @"
        SELECT COALESCE(SUM(valor), 0) AS total
        FROM lancamentosfinanceiros
        WHERE empresaid = @EmpresaId
          AND tipo = 'Despesa'
          AND datapagamento BETWEEN @DataInicio AND @DataFim;";

            var totalDespesas = await connection.ExecuteScalarAsync<decimal>(sqlDespesas,
                new { EmpresaId = empresaId, DataInicio = dataInicio.Date, DataFim = dataFim.Date });

            // 4. Detalhamento das despesas
            var sqlDetalheDespesas = @"
                                     SELECT categoria, descricao, valor, datapagamento, formapagamento
                                     FROM lancamentosfinanceiros
                                     WHERE empresaid = @EmpresaId
                                       AND tipo = 'Despesa'
                                       AND datapagamento BETWEEN @DataInicio AND @DataFim
                                     ORDER BY datapagamento DESC;";

            var despesas = await connection.QueryAsync(sqlDetalheDespesas,
                new { EmpresaId = empresaId, DataInicio = dataInicio.Date, DataFim = dataFim.Date });

            // 5. Faturamento por dia (para o gráfico)
            var sqlPorDia = @"
                             SELECT 
                                 (os.dataabertura AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date AS dia,
                                 SUM(os.valortotal) AS faturamento
                             FROM ordensservico os
                             WHERE os.empresaid = @EmpresaId
                               AND os.status = 'Faturada'
                               AND (os.dataabertura AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date
                                   BETWEEN @DataInicio AND @DataFim
                             GROUP BY dia
                             ORDER BY dia;";

            var porDia = await connection.QueryAsync(sqlPorDia,
                new { EmpresaId = empresaId, DataInicio = dataInicio.Date, DataFim = dataFim.Date });

            return new
            {
                faturamento,
                custoPecas,
                totalDespesas,
                lucroReal = faturamento - custoPecas - totalDespesas,
                margemLucro = faturamento > 0 ? Math.Round((faturamento - custoPecas - totalDespesas) / faturamento * 100, 1) : 0,
                despesas,
                porDia
            };
        }


    }
}
