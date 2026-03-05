using Microsoft.AspNetCore.Mvc;

namespace SagitarioSys.Web.Areas.Oficina.Controllers
{
    [Area("Oficina")]
    public class CategoriasFinanceirasController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}