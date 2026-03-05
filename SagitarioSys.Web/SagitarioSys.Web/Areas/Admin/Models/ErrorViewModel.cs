using System;

namespace SagitarioSys.Web.Areas.Admin.Models // (E o da Oficina)
{
    public class ErrorViewModel
    {
        public string? RequestId { get; set; } // ✨ Interrogação adicionada aqui!
        public bool ShowRequestId => !string.IsNullOrEmpty(RequestId);
    }
}