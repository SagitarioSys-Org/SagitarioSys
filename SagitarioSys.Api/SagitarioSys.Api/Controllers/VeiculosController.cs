using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SagitarioSys.Api.Models;
using SagitarioSys.Api.Repositories;

namespace SagitarioSys.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Qualquer usuário da oficina pode acessar, mas só vê os carros da própria oficina
    public class VeiculosController : ControllerBase
    {
        private readonly VeiculoRepository _repository;

        public VeiculosController(VeiculoRepository repository)
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

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            if (EmpresaIdLogada == Guid.Empty) return Unauthorized();
            return Ok(await _repository.ObterTodosAsync(EmpresaIdLogada));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var veiculo = await _repository.ObterPorIdAsync(id, EmpresaIdLogada);
            if (veiculo == null) return NotFound();
            return Ok(veiculo);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Veiculo veiculo)
        {
            veiculo.EmpresaId = EmpresaIdLogada;
            if (veiculo.EmpresaId == Guid.Empty) return Unauthorized();

            veiculo.Id = await _repository.CriarAsync(veiculo);
            return Ok(veiculo);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] Veiculo veiculo)
        {
            if (id != veiculo.Id) return BadRequest();

            veiculo.EmpresaId = EmpresaIdLogada;
            var sucesso = await _repository.AtualizarAsync(veiculo);

            if (!sucesso) return NotFound();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var sucesso = await _repository.DeletarAsync(id, EmpresaIdLogada);
            if (!sucesso) return NotFound();
            return Ok();
        }
    }
}