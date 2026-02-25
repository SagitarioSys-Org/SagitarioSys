using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SagitarioSys.Api.Models;
using SagitarioSys.Api.Repositories;

namespace SagitarioSys.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SegmentosController : ControllerBase
    {
        private readonly SegmentoRepository _repository;

        public SegmentosController(SegmentoRepository repository)
        {
            _repository = repository;
        }

        // Rota pública para usuários logados (Usada no modal de novo cliente)
        [HttpGet("ativos")]
        [Authorize]
        public async Task<IActionResult> GetAllAtivos()
        {
            return Ok(await _repository.ObterAtivosAsync());
        }

        // ==========================================
        // ÁREA VIP DO CEO (Apenas SuperAdmin)
        // ==========================================

        [HttpGet]
        [Authorize(Roles = "SuperAdmin")]
        public async Task<IActionResult> GetAll()
        {
            return Ok(await _repository.ObterTodosAdminAsync());
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "SuperAdmin")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var segmento = await _repository.ObterPorIdAsync(id);
            if (segmento == null) return NotFound();
            return Ok(segmento);
        }

        [HttpPost]
        [Authorize(Roles = "SuperAdmin")]
        public async Task<IActionResult> Create([FromBody] Segmento segmento)
        {
            segmento.Id = await _repository.CriarAsync(segmento);
            return Ok(segmento);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "SuperAdmin")]
        public async Task<IActionResult> Update(Guid id, [FromBody] Segmento segmento)
        {
            segmento.Id = id;
            var sucesso = await _repository.AtualizarAsync(segmento);
            if (!sucesso) return NotFound();
            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "SuperAdmin")]
        public async Task<IActionResult> Delete(Guid id)
        {
            // Proteção para não inativar a Matriz e a Oficina
            if (id.ToString() == "11111111-1111-1111-1111-111111111111" ||
                id.ToString() == "22222222-2222-2222-2222-222222222222")
                return BadRequest(new { message = "Segmentos de sistema não podem ser inativados." });

            var sucesso = await _repository.InativarAsync(id);
            if (!sucesso) return NotFound();
            return Ok();
        }
    }
}