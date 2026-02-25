using Microsoft.AspNetCore.Mvc;

namespace SagitarioSys.Web.Controllers
{
    public class VeiculosController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}