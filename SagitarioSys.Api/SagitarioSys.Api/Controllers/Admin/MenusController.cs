using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SagitarioSys.Api.Models.Admin;
using SagitarioSys.Api.Repositories.Admin;

namespace SagitarioSys.Api.Controllers.Admin
{
    [Route("api/Admin/[controller]")]
    [ApiController]
    [Authorize] // Qualquer usuário logado pode buscar os menus do seu próprio segmento
    public class MenusController : ControllerBase
    {
        private readonly MenuRepository _repository;

        public MenusController(MenuRepository repository)
        {
            _repository = repository;
        }

        [HttpGet("meus-menus")]
        public async Task<IActionResult> GetMeusMenus([FromQuery] string segmento)
        {
            if (string.IsNullOrWhiteSpace(segmento))
                return BadRequest(new { message = "O nome do segmento não foi informado." });

            // Extrai o ID da empresa direto do Token de quem está logado (Segurança Máxima)
            var claimEmpresaId = User.FindFirst("EmpresaId")?.Value;
            if (!Guid.TryParse(claimEmpresaId, out var empresaId))
                return Unauthorized();

            // Passa o segmento e a empresa para o Dapper fazer a mágica
            var menus = await _repository.ObterMenusPorSegmentoAsync(segmento, empresaId);
            return Ok(menus);
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
            var menu = await _repository.ObterPorIdAsync(id);
            if (menu == null) return NotFound();
            return Ok(menu);
        }

        [HttpPost]
        [Authorize(Roles = "SuperAdmin")]
        public async Task<IActionResult> Create([FromBody] Menu menu)
        {
            menu.Id = await _repository.CriarAsync(menu);
            return Ok(menu);
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "SuperAdmin")]
        public async Task<IActionResult> Update(Guid id, [FromBody] Menu menu)
        {
            menu.Id = id;
            var sucesso = await _repository.AtualizarAsync(menu);
            if (!sucesso) return NotFound();
            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "SuperAdmin")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var sucesso = await _repository.DeletarAsync(id);
            if (!sucesso) return NotFound();
            return Ok();
        }
    }
}