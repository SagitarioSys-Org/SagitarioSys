using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SagitarioSys.Api.Models;
using SagitarioSys.Api.Repositories;

namespace SagitarioSys.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "SuperAdmin")] // Segurança máxima em todos os métodos!
    public class AssinantesController : ControllerBase
    {
        private readonly AssinanteRepository _repository;

        public AssinantesController(AssinanteRepository repository)
        {
            _repository = repository;
        }

        // --- MÉTODO POST (O que já tínhamos) ---
        [HttpPost]
        public async Task<IActionResult> RegistrarNovoAssinante([FromBody] NovoAssinanteRequest request)
        {
            try
            {
                string senhaCriptografada = BCrypt.Net.BCrypt.HashPassword(request.SenhaAdmin);
                await _repository.CriarAssinanteCompletoAsync(request, senhaCriptografada);
                return Ok(new { message = $"A empresa {request.NomeFantasia} foi criada com sucesso!" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Erro ao cadastrar assinante.", detalhe = ex.Message });
            }
        }

        // --- NOVOS MÉTODOS ---

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var empresas = await _repository.ObterTodosAsync();
            return Ok(empresas);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var empresa = await _repository.ObterPorIdAsync(id);
            if (empresa == null) return NotFound(new { message = "Empresa não encontrada." });
            return Ok(empresa);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] Empresa empresa)
        {
            // O front-end manda o ID na URL, então injetamos ele no objeto
            empresa.Id = id;

            var sucesso = await _repository.AtualizarAsync(empresa);
            if (!sucesso) return NotFound(new { message = "Empresa não encontrada." });

            return NoContent(); // 204 No Content (Sucesso sem corpo de resposta)
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            // Proteção extra: Não deixa você inativar a própria Matriz (Sagitario Sys)
            if (id.ToString() == "11111111-1111-1111-1111-111111111111")
            {
                return BadRequest(new { message = "Você não pode inativar a empresa matriz do sistema." });
            }

            var sucesso = await _repository.InativarAsync(id);
            if (!sucesso) return NotFound(new { message = "Empresa não encontrada." });

            return Ok(new { message = "Empresa inativada com sucesso." });
        }
    }
}