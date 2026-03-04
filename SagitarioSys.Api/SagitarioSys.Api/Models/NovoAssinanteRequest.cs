namespace SagitarioSys.Api.Models
{
    public class NovoAssinanteRequest
    {
        // Empresa
        public string NomeFantasia { get; set; } = string.Empty;
        public string RazaoSocial { get; set; } = string.Empty;
        public string CnpjCpf { get; set; } = string.Empty;
        public string InscricaoEstadual { get; set; } = string.Empty;
        public Guid SegmentoId { get; set; }
        public string TelefoneEmpresa { get; set; } = string.Empty;
        public string EmailContatoEmpresa { get; set; } = string.Empty;

        // Endereço
        public string Cep { get; set; } = string.Empty;
        public string Logradouro { get; set; } = string.Empty;
        public string Numero { get; set; } = string.Empty;
        public string Complemento { get; set; } = string.Empty;
        public string Bairro { get; set; } = string.Empty;
        public string Cidade { get; set; } = string.Empty;
        public string Uf { get; set; } = string.Empty;

        // Admin
        public string NomeAdmin { get; set; } = string.Empty;
        public string CpfAdmin { get; set; } = string.Empty;
        public string TelefoneAdmin { get; set; } = string.Empty;
        public string EmailAdmin { get; set; } = string.Empty;
        public string SenhaAdmin { get; set; } = string.Empty;
    }
}