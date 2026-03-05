using Microsoft.AspNetCore.Mvc;

namespace SagitarioSys.Web.Areas.Oficina.Controllers
{
    [Area("Oficina")]
    public class DashBoardController : Controller
    {
        // Este é o novo endpoint específico da Oficina
        public IActionResult Index()
        {
            return View();
        }
    }
}