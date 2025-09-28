// src/styled.d.ts
import "styled-components";

declare module "styled-components" {
  export interface DefaultTheme {
    colors: {
      bg: string;
      fg: string;
      muted: string;
      border: string;
      ok: string;
      warn: string;
      card: string;
      btn: string;
    };
    radius: { sm: string; md: string; lg: string };
    font: { base: string };
  }
}
