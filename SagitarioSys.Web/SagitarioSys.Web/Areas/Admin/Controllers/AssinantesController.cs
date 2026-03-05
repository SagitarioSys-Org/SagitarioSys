using Microsoft.AspNetCore.Mvc;

namespace SagitarioSys.Web.Areas.Admin.Controllers
{
    [Area("Admin")]
    public class AssinantesController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}