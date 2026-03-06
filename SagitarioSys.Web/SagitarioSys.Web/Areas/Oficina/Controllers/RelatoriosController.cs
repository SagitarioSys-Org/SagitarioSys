using Microsoft.AspNetCore.Mvc;

namespace SagitarioSys.Web.Areas.Oficina.Controllers
{
    [Area("Oficina")]
    public class RelatoriosController : Controller
    {
        public IActionResult RelEstoque() => View();
        public IActionResult ImprimirEstoque() => View();

        public IActionResult RelVendas() => View();
        public IActionResult ImprimirVendas() => View();

        public IActionResult RelServicos() => View();
        public IActionResult ImprimirServicos() => View();

        public IActionResult RelPecas() => View();
        public IActionResult ImprimirPecas() => View();  

        public IActionResult RelLucroReal() => View();
        public IActionResult ImprimirLucroReal() => View();  

    }
}
