import { render, act } from "@testing-library/react";
import { CartProvider, useCart } from "../contexts/CartContext";
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";

// Mock the toast hook since it's used in CartContext
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const TestComponent = () => {
  const { cart, addToCart } = useCart();
  return (
    <div>
      <div data-testid="cart-length">{cart.length}</div>
      <button onClick={() => addToCart({ 
        eventId: "1", 
        eventName: "Event", 
        categoryId: "c1", 
        categoryName: "Cat", 
        price: 100, 
        quantity: 1 
      })}>
        Add
      </button>
    </div>
  );
};

describe("CartProvider", () => {
  beforeEach(() => {
    if (typeof window !== "undefined") {
      window.localStorage.clear();
      window.sessionStorage.clear();
    }
  });

  it("should use sessionStorage instead of localStorage to persist cart", async () => {
    const { getByText } = render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    const addButton = getByText("Add");
    await act(async () => {
      addButton.click();
    });

    // Verify sessionStorage has the data
    const sessionData = sessionStorage.getItem("cart");
    expect(sessionData).not.toBeNull();
    expect(JSON.parse(sessionData!)[0].categoryId).toBe("c1");

    // Verify localStorage DOES NOT have the data
    expect(localStorage.getItem("cart")).toBeNull();
  });

  it("should cleanup old localStorage cart on mount", () => {
    // Pre-fill localStorage with old data
    localStorage.setItem("cart", JSON.stringify([{ id: "old-item" }]));
    
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    // Verify localStorage was cleared
    expect(localStorage.getItem("cart")).toBeNull();
  });

  it("should load initial state from sessionStorage", () => {
    const initialData = [{ 
      id: "init", 
      eventId: "1", 
      eventName: "E", 
      categoryId: "c1", 
      categoryName: "C", 
      price: 10, 
      quantity: 1 
    }];
    sessionStorage.setItem("cart", JSON.stringify(initialData));

    const { getByTestId } = render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    expect(getByTestId("cart-length").textContent).toBe("1");
  });
});
