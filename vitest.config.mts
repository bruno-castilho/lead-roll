import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// As datas são formatadas com o fuso do processo (Intl sem `timeZone`). O fuso
// fica fixo para os testes darem o mesmo resultado em qualquer máquina.
process.env.TZ = "America/Sao_Paulo";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    clearMocks: true,
    restoreMocks: true,
    setupFiles: ["src/test/setup-dom.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/test/**",
        "src/shared/ui/primitives/**",
      ],
    },
  },
});
