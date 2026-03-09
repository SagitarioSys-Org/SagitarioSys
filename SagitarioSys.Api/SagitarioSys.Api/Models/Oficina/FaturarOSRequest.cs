using System;

namespace SagitarioSys.Api.Models.Oficina
{
    public class FaturarOSRequest
    {
        public string FormaPagamento { get; set; } = string.Empty;
        public DateTime DataPagamento { get; set; }
    }
}