using Microsoft.AspNetCore.Mvc;

namespace SagitarioSys.Web.Areas.Oficina.Controllers
{
    [Area("Oficina")]
    public class FornecedoresController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}