using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SagitarioSys.Api.Models;
using SagitarioSys.Api.Repositories;

namespace SagitarioSys.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class OrdensServicoController : ControllerBase
    {
        private readonly OrdemServicoRepository _repository;
        private readonly FinanceiroRepository _financeiroRepo;

        public OrdensServicoController(OrdemServicoRepository repository, FinanceiroRepository financeiroRepo)
        {
            _repository = repository;
            _financeiroRepo = financeiroRepo;
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
            var os = await _repository.ObterPorIdAsync(id, EmpresaIdLogada);
            if (os == null) return NotFound();
            return Ok(os);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] OrdemServico os)
        {
            os.EmpresaId = EmpresaIdLogada;
            if (os.EmpresaId == Guid.Empty) return Unauthorized();

            os.Id = await _repository.CriarAsync(os);
            return Ok(os);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] OrdemServico os)
        {
            // 1. O erro pode estar aqui: Se o JS não mandou o ID certo, ele avisa!
            if (id != os.Id)
                return BadRequest(new { message = $"O ID da rota ({id}) não bate com o ID do pacote enviado ({os.Id})." });

            // ✨ TRAVA DE SEGURANÇA: Busca a OS no banco para ver o status real dela
            var osBanco = await _repository.ObterPorIdAsync(id, EmpresaIdLogada);
            if (osBanco == null) return NotFound();

            // Se já estiver Faturada no banco, bloqueia qualquer edição!
            if (osBanco.Status == "Faturada")
                return BadRequest(new { message = "Segurança: Uma OS Faturada não pode ser alterada." });

            os.EmpresaId = EmpresaIdLogada;

            var sucesso = await _repository.AtualizarAsync(os);

            if (!sucesso)
                return NotFound(new { message = "A Ordem de Serviço não foi encontrada no banco de dados." });

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            // ✨ TRAVA DE SEGURANÇA: Não deixa cancelar OS que já gerou dinheiro no caixa
            var osBanco = await _repository.ObterPorIdAsync(id, EmpresaIdLogada);
            if (osBanco != null && osBanco.Status == "Faturada")
                return BadRequest(new { message = "Segurança: Não é possível cancelar uma OS que já foi paga. Estorne o lançamento financeiro primeiro." });

            var sucesso = await _repository.DeletarAsync(id, EmpresaIdLogada);
            if (!sucesso) return NotFound();
            return Ok();
        }

        [HttpPost("{id}/faturar")]
        public async Task<IActionResult> Faturar(Guid id, [FromBody] FaturarOSRequest request)
        {
            try
            {
                if (EmpresaIdLogada == Guid.Empty) return Unauthorized();

                // 1. Busca a OS no banco para pegar o Valor Real e o Cliente Real (Blindagem contra fraudes)
                var os = await _repository.ObterPorIdAsync(id, EmpresaIdLogada);
                if (os == null) return NotFound(new { message = "OS não encontrada." });

                if (os.Status == "Faturada")
                    return BadRequest(new { message = "Esta OS já foi faturada e lançada no caixa." });

                // 2. Muda o status da OS
                await _repository.AtualizarStatusAsync(id, EmpresaIdLogada, "Faturada");

                // 3. Monta o lançamento financeiro com os dados confiáveis do banco
                var lancamento = new LancamentoFinanceiro
                {
                    EmpresaId = EmpresaIdLogada,
                    OrdemServicoId = id,
                    ClienteId = os.ClienteId,
                    Tipo = "Receita",
                    Categoria = "Recebimento de OS", // Garanta que essa categoria exista no seu banco/tela
                    Descricao = "Faturamento da OS",
                    Valor = os.ValorTotal,
                    DataVencimento = request.DataPagamento,
                    DataPagamento = request.DataPagamento,
                    Status = "Pago",
                    FormaPagamento = request.FormaPagamento
                };

                // 4. Injeta o dinheiro no Fluxo de Caixa!
                await _financeiroRepo.CriarAsync(lancamento);

                return Ok(new { message = "OS faturada e lançada no caixa com sucesso!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Erro ao faturar: " + ex.Message });
            }
        }
    }
}