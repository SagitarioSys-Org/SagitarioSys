using System;

namespace SagitarioSys.Api.Models
{
    public class Empresa
    {
        public Guid Id { get; set; }
        public string NomeFantasia { get; set; } = string.Empty;
        public string RazaoSocial { get; set; } = string.Empty;
        public string CnpjCpf { get; set; } = string.Empty;
        public string InscricaoEstadual { get; set; } = string.Empty;
        public Guid SegmentoId { get; set; }

        // Contatos da Empresa
        public string Telefone { get; set; } = string.Empty;
        public string EmailContato { get; set; } = string.Empty;

        // Endereço
        public string Cep { get; set; } = string.Empty;
        public string Logradouro { get; set; } = string.Empty;
        public string Numero { get; set; } = string.Empty;
        public string Complemento { get; set; } = string.Empty;
        public string Bairro { get; set; } = string.Empty;
        public string Cidade { get; set; } = string.Empty;
        public string Uf { get; set; } = string.Empty;

        // Auxiliares (Não são colunas reais da tabela Empresas, são preenchidos por JOINs)
        public string NomeSegmento { get; set; } = string.Empty;
        public bool Ativo { get; set; }
        public DateTime DataCadastro { get; set; }
        public string EmailAdmin { get; set; } = string.Empty;
    }
}