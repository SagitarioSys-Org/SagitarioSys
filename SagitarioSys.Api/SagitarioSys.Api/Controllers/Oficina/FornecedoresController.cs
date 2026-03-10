using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SagitarioSys.Api.Models.Oficina;
using SagitarioSys.Api.Repositories.Oficina;

namespace SagitarioSys.Api.Controllers.Oficina
{
    [Route("api/Oficina/[controller]")]
    [ApiController]
    [Authorize]
    public class FornecedoresController : ControllerBase
    {
        private readonly FornecedorRepository _repository;

        public FornecedoresController(FornecedorRepository repository)
        {
            _repository = repository;
        }

        private bool TryObterEmpresaId(out Guid empresaId)
            => Guid.TryParse(User.FindFirst("EmpresaId")?.Value, out empresaId);

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? busca)
        {
            if (!TryObterEmpresaId(out var empresaId)) return Unauthorized();
            return Ok(await _repository.ObterTodosAsync(empresaId, busca?.Trim()));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            if (!TryObterEmpresaId(out var empresaId)) return Unauthorized();
            var fornecedor = await _repository.ObterPorIdAsync(id, empresaId);
            return fornecedor == null ? NotFound() : Ok(fornecedor);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Fornecedor fornecedor)
        {
            if (!TryObterEmpresaId(out var empresaId)) return Unauthorized();
            if (fornecedor == null) return BadRequest(new { message = "Dados do fornecedor são obrigatórios." });
            if (string.IsNullOrWhiteSpace(fornecedor.NomeFantasia) || string.IsNullOrWhiteSpace(fornecedor.Documento))
                return BadRequest(new { message = "Nome fantasia e documento são obrigatórios." });

            fornecedor.EmpresaId = empresaId;
            fornecedor.Id = await _repository.CriarAsync(fornecedor);
            return Ok(fornecedor);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] Fornecedor fornecedor)
        {
            if (!TryObterEmpresaId(out var empresaId)) return Unauthorized();
            if (fornecedor == null || id != fornecedor.Id) return BadRequest();
            if (string.IsNullOrWhiteSpace(fornecedor.NomeFantasia) || string.IsNullOrWhiteSpace(fornecedor.Documento))
                return BadRequest(new { message = "Nome fantasia e documento são obrigatórios." });

            fornecedor.EmpresaId = empresaId;
            return await _repository.AtualizarAsync(fornecedor) ? NoContent() : NotFound();
        }
    }
}