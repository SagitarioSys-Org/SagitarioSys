using System;

namespace SagitarioSys.Api.Models.Oficina
{
    public class LancamentoFinanceiro
    {
        public Guid Id { get; set; }
        public Guid EmpresaId { get; set; } // Trava do Multi-tenant

        public Guid? ClienteId { get; set; } // Nulo para despesas gerais
        public Guid? OrdemServicoId { get; set; } // Vincula o dinheiro à OS

        public string Tipo { get; set; } = string.Empty; // "Receita" ou "Despesa"

        // Ex: "Serviço", "Peças", "Água", "Energia Elétrica", "Internet", "Aluguel"
        public string Categoria { get; set; } = string.Empty;

        public string Descricao { get; set; } = string.Empty;
        public decimal Valor { get; set; }

        public DateTime DataVencimento { get; set; }
        public DateTime? DataPagamento { get; set; }

        public string Status { get; set; } = string.Empty; // "Pendente", "Pago", "Atrasado"
        public string? FormaPagamento { get; set; } // "PIX", "Cartão", "Dinheiro"

        public DateTime DataCadastro { get; set; }
    }
}