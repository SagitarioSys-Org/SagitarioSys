using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SagitarioSys.Api.Repositories.Oficina;

namespace SagitarioSys.Api.Controllers.Oficina
{
    [Route("api/Oficina/[controller]")]
    [ApiController]
    [Authorize]
    public class RelatoriosController : ControllerBase
    {
        private readonly RelatoriosRepository _repository;

        public RelatoriosController(RelatoriosRepository repository)
        {
            _repository = repository;
        }

        private Guid EmpresaIdLogada
        {
            get
            {
                var claim = User.FindFirst("EmpresaId")?.Value;
                return Guid.TryParse(claim, out var id) ? id : Guid.Empty;
            }
        }

        [HttpGet("estoque")]
        public async Task<IActionResult> GetEstoque()
        {
            if (EmpresaIdLogada == Guid.Empty) return Unauthorized();
            return Ok(await _repository.ObterEstoqueAsync(EmpresaIdLogada));
        }

        [HttpGet("vendas")]
        public async Task<IActionResult> GetVendas([FromQuery] string dataInicio, [FromQuery] string dataFim)
        {
            if (EmpresaIdLogada == Guid.Empty) return Unauthorized();

            if (!DateTime.TryParse(dataInicio, out var dtInicio) ||
                !DateTime.TryParse(dataFim, out var dtFim))
                return BadRequest(new { message = "Datas inválidas." });

            // Garante que pega o dia inteiro
            dtInicio = dtInicio.Date;
            dtFim = dtFim.Date.AddHours(23).AddMinutes(59).AddSeconds(59);

            var dados = await _repository.ObterVendasPeriodoAsync(EmpresaIdLogada, dtInicio, dtFim);
            return Ok(dados);
        }

        [HttpGet("servicos")]
        public async Task<IActionResult> GetServicos([FromQuery] string dataInicio, [FromQuery] string dataFim)
        {
            if (EmpresaIdLogada == Guid.Empty) return Unauthorized();

            if (!DateTime.TryParse(dataInicio, out var dtInicio) ||
                !DateTime.TryParse(dataFim, out var dtFim))
                return BadRequest(new { message = "Datas inválidas." });

            dtInicio = dtInicio.Date;
            dtFim = dtFim.Date;

            return Ok(await _repository.ObterServicosRealizadosAsync(EmpresaIdLogada, dtInicio, dtFim));
        }

        [HttpGet("pecas")]
        public async Task<IActionResult> GetPecas([FromQuery] string dataInicio, [FromQuery] string dataFim)
        {
            if (EmpresaIdLogada == Guid.Empty) return Unauthorized();

            if (!DateTime.TryParse(dataInicio, out var dtInicio) ||
                !DateTime.TryParse(dataFim, out var dtFim))
                return BadRequest(new { message = "Datas inválidas." });

            dtInicio = dtInicio.Date;
            dtFim = dtFim.Date;

            return Ok(await _repository.ObterPecasVendidasAsync(EmpresaIdLogada, dtInicio, dtFim));
        }

        [HttpGet("lucrorial")]
        public async Task<IActionResult> GetLucroReal([FromQuery] string dataInicio, [FromQuery] string dataFim)
        {
            if (EmpresaIdLogada == Guid.Empty) return Unauthorized();

            if (!DateTime.TryParse(dataInicio, out var dtInicio) ||
                !DateTime.TryParse(dataFim, out var dtFim))
                return BadRequest(new { message = "Datas inválidas." });

            return Ok(await _repository.ObterLucroRealAsync(EmpresaIdLogada, dtInicio.Date, dtFim.Date));
        }

    }
}
