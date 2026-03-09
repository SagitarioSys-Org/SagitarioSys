using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SagitarioSys.Api.Models.Oficina;
using SagitarioSys.Api.Repositories.Oficina;

namespace SagitarioSys.Api.Controllers.Oficina
{
    [Route("api/Oficina/[controller]")]
    [ApiController]
    [Authorize]
    public class EstoqueController : ControllerBase
    {
        private readonly PecaRepository _repository;
        public EstoqueController(PecaRepository repository) { _repository = repository; }

        private bool TryObterEmpresaId(out Guid empresaId)
            => Guid.TryParse(User.FindFirst("EmpresaId")?.Value, out empresaId);

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            if (!TryObterEmpresaId(out var empresaId)) return Unauthorized();
            return Ok(await _repository.ObterTodosAsync(empresaId));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            if (!TryObterEmpresaId(out var empresaId)) return Unauthorized();

            var peca = await _repository.ObterPorIdAsync(id, empresaId);
            return peca == null ? NotFound() : Ok(peca);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Peca peca)
        {
            if (peca == null) return BadRequest(new { message = "Dados da peça são obrigatórios." });
            if (!TryObterEmpresaId(out var empresaId)) return Unauthorized();

            peca.EmpresaId = empresaId;
            peca.Id = await _repository.CriarAsync(peca);
            return Ok(peca);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] Peca peca)
        {
            if (peca == null) return BadRequest(new { message = "Dados da peça são obrigatórios." });
            if (id != peca.Id) return BadRequest();
            if (!TryObterEmpresaId(out var empresaId)) return Unauthorized();

            peca.EmpresaId = empresaId;
            return await _repository.AtualizarAsync(peca) ? NoContent() : NotFound();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            if (!TryObterEmpresaId(out var empresaId)) return Unauthorized();
            return await _repository.DeletarAsync(id, empresaId) ? Ok() : NotFound();
        }
    }
}
