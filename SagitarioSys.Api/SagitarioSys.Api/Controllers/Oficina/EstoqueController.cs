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

        private Guid EmpresaIdLogada => Guid.TryParse(User.FindFirst("EmpresaId")?.Value, out var id) ? id : Guid.Empty;

        [HttpGet]
        public async Task<IActionResult> GetAll() => Ok(await _repository.ObterTodosAsync(EmpresaIdLogada));

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var peca = await _repository.ObterPorIdAsync(id, EmpresaIdLogada);
            return peca == null ? NotFound() : Ok(peca);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Peca peca)
        {
            peca.EmpresaId = EmpresaIdLogada;
            peca.Id = await _repository.CriarAsync(peca);
            return Ok(peca);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] Peca peca)
        {
            if (id != peca.Id) return BadRequest();
            peca.EmpresaId = EmpresaIdLogada;
            return await _repository.AtualizarAsync(peca) ? NoContent() : NotFound();
        }

        [HttpDelete("{id}")]
        public IActionResult Delete(Guid id)
        {
            return BadRequest("Exclusão de produtos está desabilitada para preservar o histórico. Utilize acerto de estoque.");
        }
    }
}
