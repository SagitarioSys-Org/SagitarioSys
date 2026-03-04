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

        [HttpPatch("{id}/status")]
        public async Task<IActionResult> ToggleStatus(Guid id)
        {
            // Proteção extra: Não deixa bloquear a própria Matriz (Sagitario Sys)
            if (id.ToString() == "11111111-1111-1111-1111-111111111111")
            {
                return BadRequest(new { message = "Você não pode bloquear a empresa matriz do sistema." });
            }

            var sucesso = await _repository.AlternarStatusAsync(id);
            if (!sucesso) return NotFound(new { message = "Empresa não encontrada." });

            return Ok(new { message = "Status da assinatura alterado com sucesso." });
        }

        [HttpPost("{id}/reset-senha")]
        public async Task<IActionResult> ResetarSenhaProvisoria(Guid id, [FromBody] ResetSenhaRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.NovaSenha) || request.NovaSenha.Length < 6)
            {
                return BadRequest(new { message = "A senha provisória deve ter pelo menos 6 caracteres." });
            }

            // Criptografa a senha provisória antes de salvar (Segurança sempre!)
            string senhaCriptografada = BCrypt.Net.BCrypt.HashPassword(request.NovaSenha);

            var sucesso = await _repository.ResetarSenhaAdminAsync(id, senhaCriptografada);

            if (!sucesso)
                return NotFound(new { message = "Nenhum usuário administrador encontrado para esta empresa." });

            return Ok(new { message = "Senha provisória definida com sucesso! Avise o cliente." });
        }
    }
}