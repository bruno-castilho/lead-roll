// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCountdown } from "./use-countdown";

const NOW = new Date("2026-11-15T12:00:00.000Z");

beforeEach(() => vi.useFakeTimers({ now: NOW }));
afterEach(() => vi.useRealTimers());

describe("useCountdown", () => {
  it("sem prazo: null", () => {
    const { result } = renderHook(() => useCountdown(null));
    expect(result.current).toBeNull();
  });

  it("conta a cada segundo e para em zero", () => {
    const { result } = renderHook(() =>
      useCountdown("2026-11-15T12:00:02.500Z"),
    );
    expect(result.current).toBe(2500);
    act(() => vi.advanceTimersByTime(500));
    expect(result.current).toBe(2000);
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current).toBe(1000);
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current).toBe(0);
    act(() => vi.advanceTimersByTime(5000));
    expect(result.current).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("recomeça quando o prazo muda", () => {
    const { result, rerender } = renderHook<
      number | null,
      { until: string | null }
    >(({ until }) => useCountdown(until), {
      initialProps: { until: "2026-11-15T12:00:01Z" },
    });
    expect(result.current).toBe(1000);
    rerender({ until: "2026-11-15T12:05:00Z" });
    expect(result.current).toBe(5 * 60 * 1000);
    rerender({ until: null });
    expect(result.current).toBeNull();
  });
});
