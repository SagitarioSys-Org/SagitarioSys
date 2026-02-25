namespace SagitarioSys.Api.Models
{
    public class NovoAssinanteRequest
    {
        // Dados da Empresa
        public string NomeFantasia { get; set; } = string.Empty;
        public string CnpjCpf { get; set; } = string.Empty;
        public Guid SegmentoId { get; set; }

        // Dados do Primeiro Acesso (Usuário Administrador daquela empresa)
        public string NomeAdmin { get; set; } = string.Empty;
        public string EmailAdmin { get; set; } = string.Empty;
        public string SenhaAdmin { get; set; } = string.Empty;
    }
}