using Microsoft.AspNetCore.Mvc;

namespace SagitarioSys.Web.Controllers
{
    public class MenusController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}
