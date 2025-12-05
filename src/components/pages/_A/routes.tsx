import { type RouteObject } from "react-router";
import HomePage from "@/components/pages/_A/Home/HomePage";
import LoginPage from "@/components/pages/_A/Login/LoginPage";
import EmpresasPage from "@/components/pages/_A/Empresas/EmpresasPage";
import AdminLayout from "@/components/pages/_A/Layout/AdminLayout";
import { AdminAuthGuard } from "@/components/guards/admin-auth.guard";

export const appRoutes: RouteObject[] = [
  {
    path: "/a/login",
    element: <LoginPage />,
  },
  {
    path: "/a",
    element: (
      <AdminAuthGuard requireRole="superadmin">
        <AdminLayout />
      </AdminAuthGuard>
    ),
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "empresas",
        element: <EmpresasPage />,
      },
    ],
  },
];
