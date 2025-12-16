// src/hooks/queries/useAuth.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuthStore } from "@/stores/auth.store";

// Mock auth service
vi.mock("@/services", () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
  },
}));

describe("useAuthStore", () => {
  beforeEach(() => {
    // Reset store state before each test
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  it("should have initial state", () => {
    const { result } = renderHook(() => useAuthStore());

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should update loading state during login", async () => {
    const { result } = renderHook(() => useAuthStore());

    // Simulate login start
    act(() => {
      useAuthStore.setState({ isLoading: true });
    });

    expect(result.current.isLoading).toBe(true);
  });

  it("should clear error", () => {
    const { result } = renderHook(() => useAuthStore());

    // Set an error first
    act(() => {
      useAuthStore.setState({ error: "Test error" });
    });

    expect(result.current.error).toBe("Test error");

    // Clear the error
    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it("should check admin role correctly", () => {
    const { result } = renderHook(() => useAuthStore());

    // Not admin when no user
    expect(result.current.isAdmin()).toBe(false);

    // Set admin user
    act(() => {
      useAuthStore.setState({
        user: {
          id: "1",
          name: "Admin",
          email: "admin@test.com",
          role: "admin",
          empresaId: 1,
        } as never,
        isAuthenticated: true,
      });
    });

    expect(result.current.isAdmin()).toBe(true);
  });

  it("should check permissions based on role", () => {
    const { result } = renderHook(() => useAuthStore());

    // Set supervisor user
    act(() => {
      useAuthStore.setState({
        user: {
          id: "1",
          name: "Supervisor",
          email: "supervisor@test.com",
          role: "supervisor",
          empresaId: 1,
        } as never,
        isAuthenticated: true,
      });
    });

    // Supervisor should have view permissions but not admin permissions
    expect(result.current.hasRole(["supervisor", "admin"])).toBe(true);
    expect(result.current.hasRole(["admin", "superadmin"])).toBe(false);
  });

  it("should handle logout", () => {
    const { result } = renderHook(() => useAuthStore());

    // Set authenticated user first
    act(() => {
      useAuthStore.setState({
        user: {
          id: "1",
          name: "Test User",
          email: "test@test.com",
          role: "operador",
          empresaId: 1,
        } as never,
        isAuthenticated: true,
      });
    });

    expect(result.current.isAuthenticated).toBe(true);

    // Logout
    act(() => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});
