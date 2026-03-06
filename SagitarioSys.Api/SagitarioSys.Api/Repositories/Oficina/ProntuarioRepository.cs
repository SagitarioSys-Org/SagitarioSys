using Dapper;
using SagitarioSys.Api.Data;

namespace SagitarioSys.Api.Repositories.Oficina
{
    public class ProntuarioRepository
    {
        private readonly IDbConnectionFactory _dbFactory;

        public ProntuarioRepository(IDbConnectionFactory dbFactory)
        {
            _dbFactory = dbFactory;
        }

        public async Task<object?> ObterPorPlacaAsync(string placa, Guid empresaId)
        {
            using var connection = _dbFactory.CreateConnection();

            var sqlVeiculo = @"
                SELECT 
                    v.id, v.placa, v.marca, v.modelo, v.cor,
                    v.kmatual, v.anofabricacao, v.anomodelo,
                    c.nome AS nomeCliente
                FROM veiculos v
                INNER JOIN clientes c ON v.clienteid = c.id
                WHERE UPPER(v.placa) = UPPER(@Placa) 
                  AND v.empresaid = @EmpresaId;";

            var veiculo = await connection.QuerySingleOrDefaultAsync(sqlVeiculo,
                new { Placa = placa, EmpresaId = empresaId });

            if (veiculo == null) return null;

            var sqlOrdens = @"
                SELECT 
                    id, numeroos, status, relatocliente,
                    observacoesinternas, valortotal, dataabertura, kmatual
                FROM ordensservico
                WHERE veiculoid = @VeiculoId AND empresaid = @EmpresaId
                ORDER BY dataabertura DESC;";

            var ordens = (await connection.QueryAsync(sqlOrdens,
                new { VeiculoId = (Guid)veiculo.id, EmpresaId = empresaId })).ToList();

            foreach (var os in ordens)
            {
                var sqlItens = @"
                    SELECT tipo, descricao, quantidade, valorunitario
                    FROM ordemservicoitens
                    WHERE ordemservicoid = @OsId;";

                os.itens = (await connection.QueryAsync(sqlItens,
                    new { OsId = (Guid)os.id })).ToList();
            }

            return new { veiculo, ordens };
        }
    }
}
