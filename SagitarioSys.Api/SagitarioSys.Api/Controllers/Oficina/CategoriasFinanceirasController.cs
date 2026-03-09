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

        private Guid ObterEmpresaIdDoToken()
        {
            var claimEmpresa = User.Claims.FirstOrDefault(c => c.Type == "EmpresaId");
            if (claimEmpresa == null) throw new UnauthorizedAccessException("Empresa não identificada.");
            return Guid.Parse(claimEmpresa.Value);
        }

        [HttpGet]
        public async Task<IActionResult> ObterTodos()
        {
            try
            {
                var categorias = await _repository.ObterTodosAsync(ObterEmpresaIdDoToken());
                return Ok(categorias);
            }
            catch (Exception ex) { return StatusCode(500, new { message = ex.Message }); }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> ObterPorId(Guid id)
        {
            var categoria = await _repository.ObterPorIdAsync(id, ObterEmpresaIdDoToken());
            if (categoria == null) return NotFound();
            return Ok(categoria);
        }

        [HttpPost]
        public async Task<IActionResult> Criar([FromBody] CategoriaFinanceira categoria)
        {
            categoria.EmpresaId = ObterEmpresaIdDoToken();
            var novoId = await _repository.CriarAsync(categoria);
            return Ok(new { id = novoId });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Atualizar(Guid id, [FromBody] CategoriaFinanceira categoria)
        {
            categoria.Id = id;
            categoria.EmpresaId = ObterEmpresaIdDoToken();
            await _repository.AtualizarAsync(categoria);
            return Ok();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Deletar(Guid id)
        {
            await _repository.DeletarAsync(id, ObterEmpresaIdDoToken());
            return Ok();
        }
    }
}