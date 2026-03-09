using System;

namespace SagitarioSys.Api.Models.Oficina
{
    public class CategoriaFinanceira
    {
        public Guid Id { get; set; }
        public Guid EmpresaId { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string Tipo { get; set; } = string.Empty; // "Receita" ou "Despesa"
        public DateTime DataCadastro { get; set; }
    }
}