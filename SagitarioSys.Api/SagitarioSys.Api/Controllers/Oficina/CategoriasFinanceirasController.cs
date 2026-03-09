using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SagitarioSys.Api.Models.Oficina;
using SagitarioSys.Api.Repositories.Oficina;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace SagitarioSys.Api.Controllers.Oficina
{
    [Route("api/Oficina/[controller]")]
    [ApiController]
    [Authorize]
    public class CategoriasFinanceirasController : ControllerBase
    {
        private readonly CategoriaFinanceiraRepository _repository;

        public CategoriasFinanceirasController(CategoriaFinanceiraRepository repository)
        {
            _repository = repository;
        }

        private bool TryObterEmpresaIdDoToken(out Guid empresaId)
        {
            var claimEmpresa = User.Claims.FirstOrDefault(c => c.Type == "EmpresaId");
            return Guid.TryParse(claimEmpresa?.Value, out empresaId);
        }

        [HttpGet]
        public async Task<IActionResult> ObterTodos()
        {
            try
            {
                if (!TryObterEmpresaIdDoToken(out var empresaId)) return Unauthorized();
                var categorias = await _repository.ObterTodosAsync(empresaId);
                return Ok(categorias);
            }
            catch (Exception ex) { return StatusCode(500, new { message = ex.Message }); }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> ObterPorId(Guid id)
        {
            if (!TryObterEmpresaIdDoToken(out var empresaId)) return Unauthorized();

            var categoria = await _repository.ObterPorIdAsync(id, empresaId);
            if (categoria == null) return NotFound();
            return Ok(categoria);
        }

        [HttpPost]
        public async Task<IActionResult> Criar([FromBody] CategoriaFinanceira categoria)
        {
            if (!TryObterEmpresaIdDoToken(out var empresaId)) return Unauthorized();

            categoria.EmpresaId = empresaId;
            var novoId = await _repository.CriarAsync(categoria);
            return Ok(new { id = novoId });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Atualizar(Guid id, [FromBody] CategoriaFinanceira categoria)
        {
            categoria.Id = id;
            if (!TryObterEmpresaIdDoToken(out var empresaId)) return Unauthorized();

            categoria.EmpresaId = empresaId;
            await _repository.AtualizarAsync(categoria);
            return Ok();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Deletar(Guid id)
        {
            if (!TryObterEmpresaIdDoToken(out var empresaId)) return Unauthorized();

            await _repository.DeletarAsync(id, empresaId);
            return Ok();
        }
    }
}