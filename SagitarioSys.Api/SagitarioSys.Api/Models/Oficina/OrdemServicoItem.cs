namespace SagitarioSys.Api.Models.Oficina
{
    public class OrdemServicoItem
    {
        public Guid Id { get; set; }
        public Guid OrdemServicoId { get; set; }
        public Guid? PecaId { get; set; } // NOVO: Link com o Estoque
        public string Tipo { get; set; } = string.Empty;
        public string Descricao { get; set; } = string.Empty;
        public decimal Quantidade { get; set; }
        public decimal ValorUnitario { get; set; }
        public decimal ValorTotal { get; set; }
    }
}