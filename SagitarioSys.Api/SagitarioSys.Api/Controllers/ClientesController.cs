using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SagitarioSys.Api.Models;
using SagitarioSys.Api.Repositories;
using System.Security.Claims;

namespace SagitarioSys.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize] // Bloqueia todo o controller. Só aceita requisições com JWT válido.
    public class ClientesController : ControllerBase
    {
        private readonly ClienteRepository _repository;

        public ClientesController(ClienteRepository repository)
        {
            _repository = repository;
        }

        // Propriedade privada auxiliar para extrair o EmpresaId do Token JWT de forma limpa
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
            var empresaId = EmpresaIdLogada;
            if (empresaId == Guid.Empty) return Unauthorized("Empresa não identificada no token.");

            var clientes = await _repository.ObterTodosAsync(empresaId);
            return Ok(clientes);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(Guid id)
        {
            var empresaId = EmpresaIdLogada;
            var cliente = await _repository.ObterPorIdAsync(id, empresaId);

            if (cliente == null) return NotFound(new { message = "Cliente não encontrado." });

            return Ok(cliente);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Cliente cliente)
        {
            // Força o vínculo com a empresa do usuário logado (segurança máxima)
            cliente.EmpresaId = EmpresaIdLogada;

            if (cliente.EmpresaId == Guid.Empty) return Unauthorized();

            // O Dapper vai retornar o novo ID gerado
            var novoId = await _repository.CriarAsync(cliente);
            cliente.Id = novoId;

            // Retorna 201 Created indicando o local onde o recurso pode ser acessado
            return CreatedAtAction(nameof(GetById), new { id = novoId }, cliente);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] Cliente cliente)
        {
            if (id != cliente.Id) return BadRequest(new { message = "O ID da URL não confere com o ID do corpo." });

            // Força o vínculo para evitar que alterem dados de outra empresa
            cliente.EmpresaId = EmpresaIdLogada;

            var sucesso = await _repository.AtualizarAsync(cliente);
            if (!sucesso) return NotFound(new { message = "Cliente não encontrado ou não pertence a esta empresa." });

            return NoContent(); // 204 Sucesso, mas sem corpo de resposta (padrão REST)
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var empresaId = EmpresaIdLogada;

            var sucesso = await _repository.DeletarAsync(id, empresaId);
            if (!sucesso) return NotFound(new { message = "Cliente não encontrado." });

            return Ok(new { message = "Cliente inativado com sucesso." });
        }
    }
}