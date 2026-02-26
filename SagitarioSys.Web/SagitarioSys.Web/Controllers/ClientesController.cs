using Microsoft.AspNetCore.Mvc;

namespace SagitarioSys.Web.Controllers
{
    public class ClientesController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}