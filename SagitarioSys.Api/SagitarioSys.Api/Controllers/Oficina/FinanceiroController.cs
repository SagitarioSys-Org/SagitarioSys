using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SagitarioSys.Api.Models.Oficina;
using SagitarioSys.Api.Repositories.Oficina;

namespace SagitarioSys.Api.Controllers.Oficina
{
    [Route("api/oficina/[controller]")]
    [ApiController]
    [Authorize]
    public class FinanceiroController : ControllerBase
    {
        private readonly FinanceiroRepository _repository;

        public FinanceiroController(FinanceiroRepository repository)
        {
            _repository = repository;
        }

        private Guid ObterEmpresaIdDoToken()
        {
            var claim = User.Claims.FirstOrDefault(c => c.Type == "EmpresaId");
            if (claim == null || string.IsNullOrEmpty(claim.Value))
                throw new UnauthorizedAccessException("Empresa não identificada no token.");
            return Guid.Parse(claim.Value);
        }

        [HttpGet]
        public async Task<IActionResult> ObterTodos(
            [FromQuery] string dataInicio,
            [FromQuery] string dataFim,
            [FromQuery] string filtroPor = "vencimento") // ✅ padrão é vencimento
        {
            try
            {
                var empresaId = ObterEmpresaIdDoToken();

                var dtInicio = DateTime.TryParse(dataInicio, out var di) ? di : new DateTime(DateTime.Now.Year, DateTime.Now.Month, 1);
                var dtFim = DateTime.TryParse(dataFim, out var df) ? df : new DateTime(DateTime.Now.Year, DateTime.Now.Month + 1, 1).AddDays(-1);

                var lancamentos = await _repository.ObterTodosAsync(empresaId, dtInicio, dtFim, filtroPor);
                return Ok(lancamentos);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Erro ao buscar lançamentos: " + ex.Message });
            }
        }


        [HttpGet("{id}")]
        public async Task<IActionResult> ObterPorId(Guid id)
        {
            try
            {
                var empresaId = ObterEmpresaIdDoToken();
                var lancamento = await _repository.ObterPorIdAsync(id, empresaId);
                if (lancamento == null) return NotFound(new { message = "Lançamento não encontrado." });
                return Ok(lancamento);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Erro ao buscar lançamento: " + ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Adicionar([FromBody] LancamentoFinanceiro lancamento)
        {
            try
            {
                lancamento.EmpresaId = ObterEmpresaIdDoToken();
                var novoId = await _repository.CriarAsync(lancamento);
                if (novoId == Guid.Empty) return BadRequest(new { message = "Erro ao registrar o lançamento." });
                return Ok(new { message = "Lançamento registrado com sucesso!", id = novoId });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Erro ao criar lançamento: " + ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Atualizar(Guid id, [FromBody] LancamentoFinanceiro lancamento)
        {
            try
            {
                lancamento.Id = id;
                lancamento.EmpresaId = ObterEmpresaIdDoToken();
                var (sucesso, mensagem) = await _repository.AtualizarAsync(lancamento);
                if (!sucesso) return BadRequest(new { message = mensagem });
                return Ok(new { message = mensagem });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Erro ao atualizar: " + ex.Message });
            }
        }


        [HttpDelete("{id}")]
        public async Task<IActionResult> Deletar(Guid id)
        {
            try
            {
                var empresaId = ObterEmpresaIdDoToken();
                var (sucesso, mensagem) = await _repository.DeletarAsync(id, empresaId);
                if (!sucesso) return BadRequest(new { message = mensagem });
                return Ok(new { message = mensagem });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Erro ao excluir lançamento: " + ex.Message });
            }
        }

        [HttpGet("resumo-mensal")]
        public async Task<IActionResult> GetResumoMensal([FromQuery] int mes, [FromQuery] int ano)
        {
            try
            {
                var empresaId = ObterEmpresaIdDoToken();
                var resumo = await _repository.ObterResumoMensalAsync(empresaId, mes, ano);
                return Ok(resumo);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Erro ao buscar resumo: " + ex.Message });
            }
        }
    }
}
