namespace SagitarioSys.Api.Models
{
    public class Empresa
    {
        public Guid Id { get; set; }
        public string NomeFantasia { get; set; } = string.Empty;
        public string CnpjCpf { get; set; } = string.Empty;
        public string TipoNegocio { get; set; } = string.Empty;
        public bool Ativo { get; set; }
        public DateTime DataCadastro { get; set; }
    }
}