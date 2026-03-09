using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SagitarioSys.Api.Models.Admin;
using SagitarioSys.Api.Repositories.Admin;

namespace SagitarioSys.Api.Controllers.Admin
{
    [Route("api/Admin/[controller]")]
    [ApiController]
    [Authorize(Roles = "SuperAdmin")]
    public class AssinantesController : ControllerBase
    {
        private readonly AssinanteRepository _repository;
        private readonly IWebHostEnvironment _environment;

        public AssinantesController(AssinanteRepository repository, IWebHostEnvironment environment)
        {
            _repository = repository;
            _environment = environment;
        }

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
            empresa.Id = id;

            var sucesso = await _repository.AtualizarAsync(empresa);
            if (!sucesso) return NotFound(new { message = "Empresa não encontrada." });

            return NoContent();
        }

        [HttpPatch("{id}/status")]
        public async Task<IActionResult> ToggleStatus(Guid id)
        {
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

            string senhaCriptografada = BCrypt.Net.BCrypt.HashPassword(request.NovaSenha);
            var sucesso = await _repository.ResetarSenhaAdminAsync(id, senhaCriptografada);

            if (!sucesso)
                return NotFound(new { message = "Nenhum usuário administrador encontrado para esta empresa." });

            return Ok(new { message = "Senha provisória definida com sucesso! Avise o cliente." });
        }

        [HttpPost("{id}/logo")]
        [Consumes("multipart/form-data")]
        [RequestSizeLimit(2 * 1024 * 1024)]
        public async Task<IActionResult> UploadLogo(Guid id, [FromForm] IFormFile arquivo)
        {
            if (arquivo == null || arquivo.Length == 0)
                return BadRequest(new { message = "Nenhum arquivo enviado." });

            const long tamanhoMaximo = 2 * 1024 * 1024;
            if (arquivo.Length > tamanhoMaximo)
                return BadRequest(new { message = "A logo deve ter no máximo 2 MB." });

            var empresa = await _repository.ObterPorIdAsync(id);
            if (empresa == null)
                return NotFound(new { message = "Empresa não encontrada." });

            var extensoesPermitidas = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                ".png", ".jpg", ".jpeg", ".webp"
            };

            var contentTypesPermitidos = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            {
                "image/png",
                "image/jpeg",
                "image/webp"
            };

            var ext = Path.GetExtension(arquivo.FileName);
            if (string.IsNullOrWhiteSpace(ext) || !extensoesPermitidas.Contains(ext))
                return BadRequest(new { message = "Formato inválido. Use PNG, JPG, JPEG ou WEBP." });

            if (string.IsNullOrWhiteSpace(arquivo.ContentType) || !contentTypesPermitidos.Contains(arquivo.ContentType))
                return BadRequest(new { message = "Tipo de arquivo inválido." });

            if (!await ArquivoEhImagemValidaAsync(arquivo))
                return BadRequest(new { message = "O arquivo enviado não é uma imagem válida." });

            var pastaLogos = Path.Combine(_environment.ContentRootPath, "wwwroot", "logos");
            if (!Directory.Exists(pastaLogos))
                Directory.CreateDirectory(pastaLogos);

            var nomeArquivo = $"{Guid.NewGuid():N}{ext.ToLowerInvariant()}";
            var caminhoFisico = Path.Combine(pastaLogos, nomeArquivo);

            await using (var stream = new FileStream(caminhoFisico, FileMode.CreateNew, FileAccess.Write))
            {
                await arquivo.CopyToAsync(stream);
            }

            var urlRelativa = $"/logos/{nomeArquivo}";
            var sucesso = await _repository.AtualizarLogomarcaAsync(id, urlRelativa);

            if (!sucesso)
            {
                if (System.IO.File.Exists(caminhoFisico))
                    System.IO.File.Delete(caminhoFisico);

                return NotFound(new { message = "Empresa não encontrada para vincular a logo." });
            }

            if (!string.IsNullOrWhiteSpace(empresa.Logomarca))
            {
                var nomeAntigo = Path.GetFileName(empresa.Logomarca);
                var caminhoAntigo = Path.Combine(pastaLogos, nomeAntigo);

                if (System.IO.File.Exists(caminhoAntigo))
                {
                    try
                    {
                        System.IO.File.Delete(caminhoAntigo);
                    }
                    catch
                    {
                    }
                }
            }

            return Ok(new { url = urlRelativa });
        }

        private static async Task<bool> ArquivoEhImagemValidaAsync(IFormFile arquivo)
        {
            byte[] header = new byte[12];

            await using var stream = arquivo.OpenReadStream();
            var bytesLidos = await stream.ReadAsync(header, 0, header.Length);

            if (bytesLidos < 4)
                return false;

            var ehPng =
                bytesLidos >= 8 &&
                header[0] == 0x89 &&
                header[1] == 0x50 &&
                header[2] == 0x4E &&
                header[3] == 0x47 &&
                header[4] == 0x0D &&
                header[5] == 0x0A &&
                header[6] == 0x1A &&
                header[7] == 0x0A;

            var ehJpeg =
                header[0] == 0xFF &&
                header[1] == 0xD8 &&
                header[2] == 0xFF;

            var ehWebp =
                bytesLidos >= 12 &&
                header[0] == 0x52 &&
                header[1] == 0x49 &&
                header[2] == 0x46 &&
                header[3] == 0x46 &&
                header[8] == 0x57 &&
                header[9] == 0x45 &&
                header[10] == 0x42 &&
                header[11] == 0x50;

            return ehPng || ehJpeg || ehWebp;
        }
    }
}
