// Arquivo: Controllers/OrdensServicoController.cs
using Microsoft.AspNetCore.Mvc;

namespace SagitarioSys.Web.Areas.Oficina.Controllers
{
    [Area("Oficina")]
    public class OrdensServicoController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
        [HttpGet("OrdensServico/Imprimir/{id}")]
        public IActionResult Imprimir(Guid id)
        {
            ViewBag.OsId = id; // Passa o ID para a tela
            return View();
        }
    }
}