using Microsoft.AspNetCore.Mvc;

namespace SagitarioSys.Web.Areas.Admin.Controllers
{
    [Area("Admin")]
    public class MenusController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
