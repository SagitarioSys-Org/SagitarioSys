using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SagitarioSys.Api.Models.Oficina;
using SagitarioSys.Api.Repositories.Oficina;

namespace SagitarioSys.Api.Controllers.Oficina
{
    [Route("api/Oficina/[controller]")]
    [ApiController]
    [Authorize]
    public class ClientesController : ControllerBase
    {
        private readonly ClienteRepository _repository;

        public ClientesController(ClienteRepository repository)
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
            var cliente = await _repository.ObterPorIdAsync(id, EmpresaIdLogada);
            if (cliente == null) return NotFound();
            return Ok(cliente);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Cliente cliente)
        {
            cliente.EmpresaId = EmpresaIdLogada;
            if (cliente.EmpresaId == Guid.Empty) return Unauthorized();

            cliente.Id = await _repository.CriarAsync(cliente);
            return Ok(cliente);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] Cliente cliente)
        {
            if (id != cliente.Id) return BadRequest();
            cliente.EmpresaId = EmpresaIdLogada;

            var sucesso = await _repository.AtualizarAsync(cliente);
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