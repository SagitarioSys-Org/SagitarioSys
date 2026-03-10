namespace SagitarioSys.Api.Models.Oficina
{
    public class Peca
    {
        public Guid Id { get; set; }
        public Guid EmpresaId { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string? Sku { get; set; }
        public string? Fornecedor { get; set; }
        public decimal Custo { get; set; }
        public decimal PrecoVenda { get; set; }
        public decimal Quantidade { get; set; }
        public decimal QuantidadeAgrupada { get; set; }
        public decimal EstoqueMinimo { get; set; }
    }
}