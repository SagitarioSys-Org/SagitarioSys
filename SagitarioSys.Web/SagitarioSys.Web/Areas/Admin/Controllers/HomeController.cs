using Microsoft.AspNetCore.Mvc;

namespace SagitarioSys.Web.Areas.Admin.Controllers
{
    [Area("Admin")]
    public class HomeController : Controller
    {
        // Esta será apenas uma página de "ponte" ou boas-vindas genérica
        public IActionResult Index()
        {
            return View();
        }       
       
        public IActionResult DashboardAdmin()
        {
            return View();
        }

        public IActionResult Login()
        {
            return View();
        }
    }
}