using Microsoft.AspNetCore.Mvc;

namespace SagitarioSys.Web.Areas.Oficina.Controllers
{
    [Area("Oficina")]
    public class ClientesController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}