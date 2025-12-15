import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Fuel, 
  Building2, 
  ShieldCheck, 
  Zap, 
  LogIn, 
  UserPlus, 
  ArrowRight 
} from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-[#0f172a] relative overflow-hidden selection:bg-blue-500/30">
      {/* Efecto de luz de fondo (Efecto Glow) */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-600/15 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-indigo-600/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#0f172a]/70 backdrop-blur-xl">
        <div className="container mx-auto max-w-7xl h-16 flex items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Fuel className="text-white w-6 h-6" />
            </div>
            <div className="hidden sm:block">
              <span className="text-xl font-bold text-white tracking-tight">GoodApps</span>
              <span className="text-blue-500 font-bold text-xl ml-1">Fuel</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              className="text-white/70 hover:text-white hover:bg-white/5 font-medium"
              onClick={() => navigate("/login")}
            >
              <LogIn className="w-4 h-4 mr-2" />
              Ingresar
            </Button>
            <Button 
              className="bg-white text-slate-950 hover:bg-slate-200 font-bold rounded-lg px-6"
              onClick={() => navigate("/registro")}
            >
              Empezar ahora
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-grow flex items-center py-12 md:py-24 px-4 sm:px-8 relative z-10">
        <div className="container mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
          <div className="md:col-span-7 text-center md:text-left space-y-8">
            <Badge 
              variant="outline" 
              className="bg-blue-500/10 text-blue-400 border-blue-500/20 px-4 py-1 text-sm font-semibold rounded-full"
            >
              ✨ Nueva Versión 2025
            </Badge>
            
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-white leading-[1.1] tracking-tight">
              Control total del <br />
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                combustible
              </span> de tu flota
            </h1>

            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto md:mx-0 leading-relaxed font-medium">
              La plataforma definitiva para gestionar cargas, vehículos y choferes. 
              Optimiza tus costos con reportes inteligentes en tiempo real.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Button 
                size="lg" 
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold h-14 px-8 rounded-xl shadow-xl shadow-blue-500/20 text-lg group"
                onClick={() => navigate("/registro")}
              >
                Crear mi cuenta gratis
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-white border-white/10 bg-white/5 hover:bg-white/10 h-14 px-8 rounded-xl text-lg font-bold"
                onClick={() => navigate("/login")}
              >
                Ver Demo
              </Button>
            </div>
          </div>

          {/* Imagen / Dashboard Preview */}
          <div className="md:col-span-5 hidden md:block">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[30px] blur opacity-25 group-hover:opacity-50 transition duration-1000" />
              <div className="relative bg-slate-900 border border-white/10 rounded-[24px] overflow-hidden shadow-2xl transition-transform duration-500 hover:scale-[1.02]">
                <img 
                  src="https://images.unsplash.com/photo-1551288049-bbb653283b78?q=80&w=1000&auto=format&fit=crop" 
                  alt="Dashboard Preview" 
                  className="w-full h-auto opacity-80"
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features Grid */}
      <section className="py-20 bg-white/[0.02] border-y border-white/5">
        <div className="container mx-auto max-w-7xl px-4 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                icon: <Building2 className="w-10 h-10 text-blue-500" />, 
                title: "Multi-Unidad", 
                desc: "Gestiona múltiples sedes o campos desde un solo panel administrativo unificado." 
              },
              { 
                icon: <ShieldCheck className="w-10 h-10 text-blue-500" />, 
                title: "Seguridad Avanzada", 
                desc: "Roles de usuario granulares y trazabilidad completa de cada carga de combustible." 
              },
              { 
                icon: <Zap className="w-10 h-10 text-blue-500" />, 
                title: "Reportes en Vivo", 
                desc: "Visualiza el consumo de tu flota al instante con gráficos dinámicos y exportación." 
              }
            ].map((feature, i) => (
              <div 
                key={i} 
                className="p-8 rounded-[24px] bg-white/5 border border-white/5 hover:border-blue-500/30 hover:bg-white/[0.07] transition-all duration-300 group"
              >
                <div className="mb-6 group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed font-medium">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5">
        <div className="container mx-auto max-w-7xl px-4 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-slate-500 text-sm font-medium order-2 md:order-1">
            © 2025 GoodApps Management. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-8 order-1 md:order-2">
            {["Términos", "Privacidad", "Soporte"].map((item) => (
              <a 
                key={item} 
                href="#" 
                className="text-slate-500 hover:text-white text-sm font-semibold transition-colors"
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}