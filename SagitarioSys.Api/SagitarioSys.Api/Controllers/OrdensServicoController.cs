using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SagitarioSys.Api.Models;
using SagitarioSys.Api.Repositories;

namespace SagitarioSys.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class OrdensServicoController : ControllerBase
    {
        private readonly OrdemServicoRepository _repository;

        public OrdensServicoController(OrdemServicoRepository repository)
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
            var os = await _repository.ObterPorIdAsync(id, EmpresaIdLogada);
            if (os == null) return NotFound();
            return Ok(os);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] OrdemServico os)
        {
            os.EmpresaId = EmpresaIdLogada;
            if (os.EmpresaId == Guid.Empty) return Unauthorized();

            os.Id = await _repository.CriarAsync(os);
            return Ok(os);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] OrdemServico os)
        {
            if (id != os.Id) return BadRequest();
            os.EmpresaId = EmpresaIdLogada;

            var sucesso = await _repository.AtualizarAsync(os);
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