namespace SagitarioSys.Api.Models.Oficina
{
    public class Fornecedor
    {
        public Guid Id { get; set; }
        public Guid EmpresaId { get; set; }
        public string NomeFantasia { get; set; } = string.Empty;
        public string? RazaoSocial { get; set; }
        public string Documento { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? Telefone { get; set; }
        public string? Whatsapp { get; set; }
        public string? Cep { get; set; }
        public string? Logradouro { get; set; }
        public string? Numero { get; set; }
        public string? Bairro { get; set; }
        public string? Cidade { get; set; }
        public string? Estado { get; set; }
        public string? Observacoes { get; set; }
        public bool Ativo { get; set; } = true;
    }
}