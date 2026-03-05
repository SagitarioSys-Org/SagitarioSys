using System;

namespace SagitarioSys.Web.Areas.Clinica.Models 
{
    public class ErrorViewModel
    {
        public string? RequestId { get; set; } 
        public bool ShowRequestId => !string.IsNullOrEmpty(RequestId);
    }
}