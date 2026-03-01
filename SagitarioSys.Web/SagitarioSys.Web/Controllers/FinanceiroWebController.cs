using Microsoft.AspNetCore.Mvc;

namespace SagitarioSys.Web.Controllers
{
    public class FinanceiroController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }
    }
}