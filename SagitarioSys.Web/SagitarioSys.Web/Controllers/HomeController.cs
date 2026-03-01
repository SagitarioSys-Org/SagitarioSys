using Microsoft.AspNetCore.Mvc;

namespace SagitarioSys.Web.Controllers
{
    public class HomeController : Controller
    {
        // Esta será apenas uma página de "ponte" ou boas-vindas genérica
        public IActionResult Index()
        {
            return View();
        }

        // Este é o novo endpoint específico da Oficina
        public IActionResult DashboardOficina()
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