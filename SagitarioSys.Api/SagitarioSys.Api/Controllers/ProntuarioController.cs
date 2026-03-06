using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SagitarioSys.Api.Repositories;

namespace SagitarioSys.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ProntuarioController : ControllerBase
    {
        private readonly ProntuarioRepository _repository;

        public ProntuarioController(ProntuarioRepository repository)
        {
            _repository = repository;
        }

        private Guid EmpresaIdLogada
        {
            get
            {
                var claim = User.FindFirst("EmpresaId")?.Value;
                return Guid.TryParse(claim, out var empresaId) ? empresaId : Guid.Empty;
            }
        }

        [HttpGet("{placa}")]
        public async Task<IActionResult> GetProntuario(string placa)
        {
            try
            {
                if (EmpresaIdLogada == Guid.Empty) return Unauthorized();

                var resultado = await _repository.ObterPorPlacaAsync(placa, EmpresaIdLogada);
                if (resultado == null) return NotFound(new { message = "Veículo não encontrado." });

                return Ok(resultado);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message, detalhe = ex.InnerException?.Message });
            }
        }
    }
}
