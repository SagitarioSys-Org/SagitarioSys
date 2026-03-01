using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SagitarioSys.Api.Models;
using SagitarioSys.Api.Repositories;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace SagitarioSys.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class FinanceiroController : ControllerBase
    {
        private readonly FinanceiroRepository _repository;

        public FinanceiroController(FinanceiroRepository repository)
        {
            _repository = repository;
        }

        private Guid ObterEmpresaIdDoToken()
        {
            var claimEmpresa = User.Claims.FirstOrDefault(c => c.Type == "EmpresaId");
            if (claimEmpresa == null || string.IsNullOrEmpty(claimEmpresa.Value))
                throw new UnauthorizedAccessException("Empresa não identificada no token.");

            return Guid.Parse(claimEmpresa.Value);
        }

        [HttpGet]
        public async Task<IActionResult> ObterTodos()
        {
            try
            {
                var empresaId = ObterEmpresaIdDoToken();
                var lancamentos = await _repository.ObterTodosAsync(empresaId);
                return Ok(lancamentos);
            }
            catch (Exception ex)
            {
                // Agora o erro vai aparecer mastigado no console/network do navegador!
                return StatusCode(500, new { message = "Erro interno ao buscar lançamentos: " + ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> ObterPorId(Guid id)
        {
            try
            {
                var empresaId = ObterEmpresaIdDoToken();
                var lancamento = await _repository.ObterPorIdAsync(id, empresaId);

                if (lancamento == null)
                    return NotFound(new { message = "Lançamento não encontrado." });

                return Ok(lancamento);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Erro interno ao buscar o lançamento: " + ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Adicionar([FromBody] LancamentoFinanceiro lancamento)
        {
            lancamento.EmpresaId = ObterEmpresaIdDoToken();

            // Agora chamamos o CriarAsync que retorna o novo ID
            var novoId = await _repository.CriarAsync(lancamento);

            if (novoId == Guid.Empty) return BadRequest(new { message = "Erro ao registrar o lançamento." });

            return Ok(new { message = "Lançamento registrado com sucesso!", id = novoId });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Atualizar(Guid id, [FromBody] LancamentoFinanceiro lancamento)
        {
            lancamento.Id = id;
            lancamento.EmpresaId = ObterEmpresaIdDoToken(); // Trava de segurança

            var sucesso = await _repository.AtualizarAsync(lancamento);
            if (!sucesso) return BadRequest(new { message = "Erro ao atualizar o lançamento ou acesso negado." });

            return Ok(new { message = "Lançamento atualizado com sucesso!" });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Deletar(Guid id)
        {
            var empresaId = ObterEmpresaIdDoToken();
            var sucesso = await _repository.DeletarAsync(id, empresaId);

            if (!sucesso) return BadRequest(new { message = "Erro ao excluir o lançamento." });

            return Ok(new { message = "Lançamento excluído com sucesso!" });
        }
    }
}